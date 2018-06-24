/* @flow */
import type { GithubApp } from "./create-github-app";
const commentTemplates = require("./comment-templates");

type ResultStatus =
  | "waiting"
  | "running"
  | "success"
  | "failure"
  | "error"
  | "canceled";

type CommentArg =
  | {|
      status: "waiting",
    |}
  | {|
      status: "running",
    |}
  | {|
      status: "success",
      output: string,
    |}
  | {|
      status: "failure",
      output: string,
      code: number,
    |}
  | {|
      status: "error",
      error: Error,
    |}
  | {|
      status: "canceled",
    |};

module.exports = class GithubReporter {
  githubApp: GithubApp;
  installationId: string;
  owner: string;
  repo: string;
  sha: string;
  number: ?string;
  jobName: string;

  constructor({
    githubApp,
    installationId,
    owner,
    repo,
    sha,
    number,
    jobName,
  }: {
    githubApp: GithubApp,
    installationId: string,
    owner: string,
    repo: string,
    sha: string,
    number?: ?string,
    jobName: string,
  }) {
    this.githubApp = githubApp;
    this.installationId = installationId;
    this.owner = owner;
    this.repo = repo;
    this.sha = sha;
    this.number = number;
    this.jobName = jobName;
  }

  async setStatus(status: ResultStatus): Promise<mixed> {
    const { githubApp, installationId, owner, repo, sha, jobName } = this;

    const stateForStatus = {
      waiting: "pending",
      running: "pending",
      success: "success",
      failure: "failure",
      error: "error",
      canceled: "failure",
    }[status];
    const descriptionForStatus = {
      waiting: `QuinCI - '${jobName}' waiting in queue`,
      running: `QuinCI - '${jobName}' running`,
      success: `QuinCI - '${jobName}' ran successfully`,
      failure: `QuinCI - '${jobName}' failed`,
      error: `QuinCI - '${jobName}' errored`,
      canceled: `QuinCI - '${jobName}' was canceled`,
    }[status];

    if (stateForStatus == null || descriptionForStatus == null) {
      return Promise.reject(new Error("Invalid status provided: " + status));
    }

    const github = await githubApp.asInstallation(installationId);
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: stateForStatus,
      description: descriptionForStatus,
      context: `quinci:${jobName}`,
    });
  }

  _commentContent(input: CommentArg): string {
    const { jobName } = this;

    switch (input.status) {
      case "waiting": {
        return commentTemplates.waiting(jobName);
      }
      case "running": {
        return commentTemplates.running(jobName);
      }
      case "success": {
        return commentTemplates.success(jobName, input.output);
      }
      case "failure": {
        return commentTemplates.failure(jobName, input.output, input.code);
      }
      case "error": {
        return commentTemplates.error(jobName, input.error);
      }
      case "canceled": {
        return commentTemplates.canceled(jobName);
      }
      default: {
        (input.status: empty);
        throw new Error("Invalid status provided: " + input.status);
      }
    }
  }

  async commitComment(input: CommentArg): Promise<mixed> {
    const { githubApp, installationId, owner, repo, sha } = this;
    const body = this._commentContent(input);
    const github = await githubApp.asInstallation(installationId);
    await github.repos.createCommitComment({
      owner,
      repo,
      sha,
      body,
    });
  }

  async issueComment(input: CommentArg): Promise<mixed> {
    const { githubApp, installationId, owner, repo, number } = this;
    const body = this._commentContent(input);
    const github = await githubApp.asInstallation(installationId);
    await github.issues.createComment({
      owner,
      repo,
      number,
      body,
    });
  }
};
