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

module.exports = class Job extends EventEmitter {
  uid: string;
  remote: string;
  commitSha: string;
  jobName: string;
  status: JobStatus;
  runResult: JobRunResult;
  createdAt: Date;
  cancel: () => void;
  _canceled: boolean;

  constructor({
    remote,
    commitSha,
    jobName,
  }: {
    remote: string,
    commitSha: string,
    jobName: string,
  }) {
    super();
    this.uid = uid();
    this.remote = remote;
    this.commitSha = commitSha;
    this.jobName = jobName;
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

  setStatus(newStatus: JobStatus, maybeError?: Error) {
    this.status = newStatus;
    this.emit(newStatus, maybeError);
  }

  run(): Promise<JobRunResult> {
    const { remote, commitSha, jobName } = this;
    const now = Date.now();
    const jobDir = `jobs/${jobName}/${now}`;
    const runDir = `${jobDir}/${commitSha}`;
    const logFile = `${runDir}/quinci-log.txt`;

    shell.mkdir("-p", runDir);
    const child: child_process$ChildProcess = spawn(
      "sh",
      [
        "-c",
        `git clone --quiet ${remote} ${commitSha} && ` +
          `cd ${commitSha} && ` +
          `git checkout --quiet ${commitSha} && ` +
          `./quinci/${jobName}`,
      ],
      {
        cwd: jobDir,
        env: Object.assign({}, process.env, {
          CI: "true",
          QUINCI_REMOTE: remote,
          QUINCI_JOB_NAME: jobName,
          QUINCI_COMMIT_SHA: commitSha,
        }),
      }
    );
    runningChildren.add(child);
    this.setStatus("running");

    return new Promise((resolve, reject) => {
      this.cancel = () => {
        this._canceled = true;
        child.kill("SIGKILL");
        this.setStatus("canceled");
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
          this.setStatus("success");
        } else {
          this.setStatus("failure");
        }
        shell.rm("-rf", jobDir);
        resolve(this.runResult);
      });
    }).catch((err) => {
      this.setStatus("error", err);
      throw err;
    });
  }
};
