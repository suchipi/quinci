/* @flow */
const EventEmitter = require("events");
const spawn = require("spawndamnit");
const shell = require("shelljs");
const uid = require("uid");

type JobStatus = "waiting" | "running" | "success" | "failure" | "error";

export type JobRunResult = {
  code: number,
  stdout: string,
  stderr: string,
  output: string,
};

module.exports = class Job extends EventEmitter {
  uid: string;
  remote: string;
  commitSha: string;
  jobName: string;
  status: JobStatus;
  runResult: JobRunResult;
  createdAt: Date;

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
    const child = spawn(
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
    this.setStatus("running");

    child.on("stdout", (data) => {
      const dataAsString = data.toString("utf-8");
      this.runResult.stdout += dataAsString;
      this.runResult.output += dataAsString;
      shell.echo(dataAsString).toEnd(logFile);
    });
    child.on("stderr", (data) => {
      const dataAsString = data.toString("utf-8");
      this.runResult.stderr += dataAsString;
      this.runResult.output += dataAsString;
      shell.echo(dataAsString).toEnd(logFile);
    });

    return child
      .then(({ code, stdout, stderr }) => {
        Object.assign(this.runResult, { code, stdout, stderr });
        if (code === 0) {
          this.setStatus("success");
        } else {
          this.setStatus("failure");
        }
        shell.rm("-rf", jobDir);
        return this.runResult;
      })
      .catch((err) => {
        this.setStatus("error", err);
        throw err;
      });
  }
};
