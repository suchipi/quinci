/* @flow */
const EventEmitter = require("events");
const onExit = require("signal-exit");
const spawn = require("cross-spawn");
const shell = require("shelljs");
const uid = require("uid");

type JobStatus =
  | "waiting"
  | "running"
  | "success"
  | "failure"
  | "error"
  | "canceled";

export type JobRunResult = {
  code: number,
  stdout: string,
  stderr: string,
  output: string,
};

const runningChildren = new Set();

onExit(() => {
  for (let child of runningChildren) {
    child.kill("SIGTERM");
  }
});

// A Job represents a task to be run for a given git commit.
//
// It is constructed with a Git remote URL, a commit sha, and the name of a job
// to execute. When you call its `run` method, it will clone the repo at that
// URL, cd into the repo, check out the commit sha, and then execute
// `./quinci/<job name>`.
//
// A Job is also an EventEmitter; it emits the following events when its status
// changes:
//
// `running` - emitted when the job starts running
// `success` - emitted when the job finishes running and it ran successfully
//             (zero exit code).
// `failure` - emitted when the job finishes running and it failed
//             (nonzero exit code).
// `error` - emitted when a JavaScript exception is thrown during job execution.
//            The error is passed to the event listener callback.
// `canceled` - emitted when someone calls the `cancel()` method on the job.
//
// At any time, you can check a job's `runResult` property for information
// about the job.
module.exports = class Job extends EventEmitter {
  // Every job has a uid, which is universally unique and can be used to find
  // the job (See `Queues#getAllJobsByUid()`).
  uid: string;

  // The git remote url that should be cloned.
  remote: string;

  // The git commit sha that should be checked out.
  commitSha: string;

  // The name of the binary in the `quinci` folder in the repo that should be
  // executed.
  taskName: string;

  status: JobStatus;
  runResult: JobRunResult;
  createdAt: Date;

  // Call this to cancel the job.
  cancel: () => void;
  _canceled: boolean;

  constructor({
    remote,
    commitSha,
    taskName,
  }: {
    remote: string,
    commitSha: string,
    taskName: string,
  }) {
    super();
    this.uid = uid();
    this.remote = remote;
    this.commitSha = commitSha;
    this.taskName = taskName;
    this.status = "waiting";
    this.runResult = {
      code: -1,
      stdout: "",
      stderr: "",
      output: "",
    };
    this.createdAt = new Date();

    this.cancel = () => {};
    this._canceled = false;
  }

  _setStatus(newStatus: JobStatus, maybeError?: Error) {
    this.status = newStatus;
    this.emit(newStatus, maybeError);
  }

  run(): Promise<JobRunResult> {
    const { remote, commitSha, taskName } = this;
    const now = Date.now();
    const jobDir = `jobs/${taskName}/${commitSha}`;
    const runDir = `${jobDir}/${now}`;
    const logFile = `${runDir}/quinci-log.txt`;

    shell.mkdir("-p", runDir);
    const child: child_process$ChildProcess = spawn(
      "sh",
      [
        "-c",
        `git clone --quiet ${remote} ${commitSha} && ` +
          `cd ${commitSha} && ` +
          `git checkout --quiet ${commitSha} && ` +
          `./quinci/${taskName}`,
      ],
      {
        cwd: jobDir,
        env: Object.assign({}, process.env, {
          CI: "true",
          QUINCI_REMOTE: remote,
          QUINCI_TASK_NAME: taskName,
          QUINCI_COMMIT_SHA: commitSha,
          QUINCI_RUN_DIR: runDir,
          QUINCI_LOG_FILE: logFile,
          QUINCI_JOB_UID: this.uid,
        }),
      }
    );
    runningChildren.add(child);
    this._setStatus("running");

    return new Promise((resolve, reject) => {
      this.cancel = () => {
        this._canceled = true;
        child.kill("SIGKILL");
        this._setStatus("canceled");
        resolve(this.runResult);
      };

      child.stdout.on("data", (data) => {
        if (this._canceled) {
          return;
        }
        const dataAsString = data.toString("utf-8");
        this.runResult.stdout += dataAsString;
        this.runResult.output += dataAsString;
        shell.echo(dataAsString).toEnd(logFile);
      });
      child.stderr.on("data", (data) => {
        if (this._canceled) {
          return;
        }
        const dataAsString = data.toString("utf-8");
        this.runResult.stderr += dataAsString;
        this.runResult.output += dataAsString;
        shell.echo(dataAsString).toEnd(logFile);
      });

      child.on("error", (err) => {
        if (this._canceled) {
          return;
        }
        runningChildren.delete(child);
        reject(err);
      });

      child.on("close", (code) => {
        if (this._canceled) {
          return;
        }
        runningChildren.delete(child);
        this.runResult.code = code;
        if (code === 0) {
          this._setStatus("success");
        } else {
          this._setStatus("failure");
        }
        shell.rm("-rf", jobDir);
        resolve(this.runResult);
      });
    }).catch((err) => {
      this._setStatus("error", err);
      throw err;
    });
  }
};
