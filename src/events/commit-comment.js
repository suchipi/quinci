/* @flow */
import type { SetupEventFunction } from "../create-webhook-handler";
const Job = require("../job");
const GithubReporter = require("../github-reporter");

module.exports = (function setupEvent({
  webhookHandler,
  appContext,
  makeLogger,
}) {
  webhookHandler.on("commit_comment", async ({ payload }) => {
    const { githubApp, queues } = appContext;
    // $FlowFixMe
    let log: (msg: string) => void;
    // $FlowFixMe
    let reporter: GithubReporter;

    try {
      const [owner, repo] = payload.repository.full_name.split("/");
      const sha = payload.comment.commit_id;
      log = makeLogger(`${repo}/${owner} ${sha}: `);

      log("Received a commit_comment event");

      if (payload.action !== "created") {
        log("Aborting because action was not 'created'");
        return;
      }
      if (payload.comment.user.type === "Bot") {
        log("Aborting because user was a bot");
        return;
      }

      const matches = payload.comment.body.match(
        /quin+c[eyi]+.* run ([\w.-]+)/i
      );
      if (!matches) {
        log("Aborting because comment body did not request a CI run");
        return;
      }
      const taskName = matches[1];

      const github = await githubApp.asInstallation(payload.installation.id);
      const username = payload.comment.user.login;

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
        taskName,
      });

      const queue = queues.getQueueFortaskName(taskName);
      log(`Queue concurrency for '${taskName}' is ${queue.getConcurrency()}.`);
      log(
        `There are ${queue.getRunning()} job(s) running in the '${taskName}' queue.`
      );
      log(
        `There are ${queue.getWaiting()} job(s) waiting in the '${taskName}' queue.`
      );

      if (!queue.canRunNow()) {
        log("Setting status to waiting");
        await reporter.setStatus("waiting");

        log("Posting waiting comment");
        await reporter.commitComment({ status: "waiting" });
      }

      const job = new Job({
        taskName,
        commitSha: sha,
        remote: payload.repository.ssh_url,
      });

      job.on("running", async () => {
        log(`Running job for '${taskName}'`);
        log("Setting status to running");
        await reporter.setStatus("running");

        log("Posting running comment");
        await reporter.commitComment({ status: "running" });
      });

      job.on("success", async () => {
        log(`Job for '${taskName}' succeeded`);
        log("Setting status to success");
        await reporter.setStatus("success");

        log("Posting success comment");
        await reporter.commitComment({
          status: "success",
          output: job.runResult.output,
        });
      });

      job.on("failure", async () => {
        log(`Job for '${taskName}' failed`);
        log("Setting status to failure");
        await reporter.setStatus("failure");

        log("Posting failure comment");
        await reporter.commitComment({
          status: "failure",
          output: job.runResult.output,
          code: job.runResult.code,
        });
      });

      job.on("error", async (error) => {
        log(`Job for '${taskName}' errored: ${error.stack}`);
        log("Setting status to error");
        await reporter.setStatus("error");

        log("Posting error comment");
        await reporter.commitComment({ status: "error", error });
      });

      job.on("canceled", async () => {
        log(`Job for '${taskName}' was canceled`);
        log("Setting status to canceled");
        await reporter.setStatus("canceled");

        log("Posting canceled comment");
        await reporter.commitComment({ status: "canceled" });
      });

      const { code } = await queue.add(job);
      log(`Job for '${taskName}' finished with status code ${code}`);
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
        await reporter.commitComment({ status: "error", error });
      } else {
        log("Could not set status and post comment because reporter was null.");
      }
    }
  });
}: SetupEventFunction);
