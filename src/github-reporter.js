/* @flow */
import type { GithubApp } from "./create-github-app";
const commentTemplates = require("./comment-templates");
const Job = require("./job");
const AppContext = require("./app-context");
const routeHelpers = require("./web-ui/route-helpers");

type ResultStatus =
  | "waiting"
  | "running"
  | "success"
  | "failure"
  | "error"
  | "canceled";

module.exports = class GithubReporter {
  appContext: AppContext;
  githubApp: GithubApp;
  installationId: string;
  owner: string;
  repo: string;
  sha: string;
  number: ?string;
  job: Job;

  constructor({
    appContext,
    githubApp,
    installationId,
    owner,
    repo,
    sha,
    number,
    job,
  }: {
    appContext: AppContext,
    githubApp: GithubApp,
    installationId: string,
    owner: string,
    repo: string,
    sha: string,
    number?: ?string,
    job: Job,
  }) {
    this.appContext = appContext;
    this.githubApp = githubApp;
    this.installationId = installationId;
    this.owner = owner;
    this.repo = repo;
    this.sha = sha;
    this.number = number;
    this.job = job;
  }

  async setStatus(status: ResultStatus): Promise<mixed> {
    const {
      appContext,
      githubApp,
      installationId,
      owner,
      repo,
      sha,
      job,
    } = this;

    const stateForStatus = {
      waiting: "pending",
      running: "pending",
      success: "success",
      failure: "failure",
      error: "error",
      canceled: "failure",
    }[status];
    const descriptionForStatus = {
      waiting: `quinCI - '${job.taskName}' waiting in queue`,
      running: `quinCI - '${job.taskName}' running`,
      success: `quinCI - '${job.taskName}' ran successfully`,
      failure: `quinCI - '${job.taskName}' failed`,
      error: `quinCI - '${job.taskName}' errored`,
      canceled: `quinCI - '${job.taskName}' was canceled`,
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
      context: `quinci:${job.taskName}`,
      target_url: routeHelpers.urlFor.jobStatus(appContext.config, job),
    });
  }

  _commentContent(result: ResultStatus, error?: Error): string {
    const { job } = this;
    if (result === "error") {
      return commentTemplates.error(job.taskName, error || job.error);
    } else {
      return commentTemplates[result](job);
    }
  }

  async commitComment(result: ResultStatus, error?: Error): Promise<mixed> {
    const { githubApp, installationId, owner, repo, sha } = this;
    const body = this._commentContent(result, error);
    const github = await githubApp.asInstallation(installationId);
    await github.repos.createCommitComment({
      owner,
      repo,
      sha,
      body,
    });
  }

  async issueComment(result: ResultStatus, error?: Error): Promise<mixed> {
    const { githubApp, installationId, owner, repo, number } = this;
    const body = this._commentContent(result, error);
    const github = await githubApp.asInstallation(installationId);
    await github.issues.createComment({
      owner,
      repo,
      number,
      body,
    });
  }
};
