/* @flow */
import type { SetupEventFunction } from "../create-webhook-handler";
const Job = require("../job");
const GithubReporter = require("../github-reporter");

module.exports = (function setupEvent({
  webhookHandler,
  appContext,
  makeLogger,
}) {
  webhookHandler.on("pull_request", async ({ payload }) => {
    const { githubApp, queues } = appContext;
    // $FlowFixMe
    let log: (msg: string) => void;
    // $FlowFixMe
    let reporter: GithubReporter;

    try {
      const [owner, repo] = payload.repository.full_name.split("/");
      const sha = payload.pull_request.head.sha;
      const number = payload.number;
      log = makeLogger(`${repo}/${owner} #${number} ${sha}: `);
      const jobName = "pull-request";

      log("Received a pull_request event");

      if (payload.action !== "synchronize" && payload.action !== "opened") {
        log("Aborting because action was not 'synchronize' or 'opened'");
        return;
      }

      const github = await githubApp.asInstallation(payload.installation.id);

      const username = payload.sender.login;
      log(`Checking if ${username} has write access`);
      const authLevelResponse = await github.repos.reviewUserPermissionLevel({
        owner,
        repo,
        username,
      });

      const permission = authLevelResponse.data.permission;
      if (permission !== "admin" && permission !== "write") {
        log("Aborting because user does not have write access");
        return;
      }

      reporter = new GithubReporter({
        githubApp,
        installationId: payload.installation.id,
        owner,
        repo,
        sha,
        number,
        jobName,
      });

      const queue = queues.getQueueForJobName(jobName);
      log(`Queue concurrency for '${jobName}' is ${queue.getConcurrency()}.`);
      log(
        `There are ${queue.getRunning()} job(s) running in the '${jobName}' queue.`
      );
      log(
        `There are ${queue.getWaiting()} job(s) waiting in the '${jobName}' queue.`
      );

      if (!queue.canRunNow()) {
        log("Setting status to waiting");
        await reporter.setStatus("waiting");

        log("Posting waiting comment");
        await reporter.issueComment({ status: "waiting" });
      }

      const job = new Job({
        jobName,
        commitSha: sha,
        remote: payload.pull_request.head.repo.ssh_url,
      });

      job.on("running", async () => {
        log(`Running job '${jobName}'`);
        log("Setting status to running");
        await reporter.setStatus("running");

        log("Posting running comment");
        await reporter.issueComment({ status: "running" });
      });

      job.on("success", async () => {
        log(`Job '${jobName}' succeeded`);
        log("Setting status to success");
        await reporter.setStatus("success");

        log("Posting success comment");
        await reporter.issueComment({
          status: "success",
          output: job.runResult.output,
        });
      });

      job.on("failure", async () => {
        log(`Job '${jobName}' failed`);
        log("Setting status to failure");
        await reporter.setStatus("failure");

        log("Posting failure comment");
        await reporter.issueComment({
          status: "failure",
          output: job.runResult.output,
          code: job.runResult.code,
        });
      });

      job.on("error", async (error) => {
        log(`Job '${jobName}' errored: ${error.stack}`);
        log("Setting status to error");
        await reporter.setStatus("error");

        await log("Posting error comment");
        await reporter.issueComment({
          status: "error",
          error,
        });
      });

      job.on("canceled", async () => {
        log(`Job '${jobName}' was canceled`);
        log("Setting status to canceled");
        await reporter.setStatus("canceled");

        log("Posting canceled comment");
        await reporter.issueComment({ status: "canceled" });
      });

      const { code } = await queue.add(job);
      log(`Job '${jobName}' finished with status code ${code}`);
    } catch (error) {
      if (log == null) {
        log = makeLogger(`Failed event handler: `);
      }
      log(
        "Error in event handler: " + (error && error.stack)
          ? error.stack
          : error
      );
      if (reporter != null) {
        log("Setting status to error");
        await reporter.setStatus("error");

        log("Posting error comment");
        await reporter.issueComment({ status: "error", error });
      } else {
        log("Could not set status and post comment because reporter was null.");
      }
    }
  });
}: SetupEventFunction);
