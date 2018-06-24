/* @flow */
import type { SetupEventFunction } from "../create-webhook-handler";
const Job = require("../job");
const GithubReporter = require("../github-reporter");

module.exports = (function setupEvent({
  webhookHandler,
  appContext,
  makeLogger,
}) {
  webhookHandler.on("push", async (event) => {
    const { githubApp, queues } = appContext;
    // $FlowFixMe
    let log: (msg: string) => void;
    // $FlowFixMe
    let reporter: GithubReporter;

    try {
      const { payload } = event;
      const [owner, repo] = payload.repository.full_name.split("/");
      const sha = payload.after;
      log = makeLogger(`${repo}/${owner} ${sha}: `);

      const jobName = "master";

      log("Received a push event");

      if (payload.ref !== "refs/heads/master") {
        log("Aborting because the push was not to master");
        return;
      }

      const reporter = new GithubReporter({
        githubApp,
        installationId: payload.installation.id,
        owner,
        repo,
        sha,
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
      }

      const job = new Job({
        jobName,
        commitSha: sha,
        remote: payload.repository.ssh_url,
      });

      job.on("running", async () => {
        log(`Running job '${jobName}'`);
        log("Setting status to running");
        await reporter.setStatus("running");
      });

      job.on("success", async () => {
        log(`Job '${jobName}' succeeded`);
        log("Setting status to success");
        await reporter.setStatus("success");
      });

      job.on("failure", async () => {
        log(`Job '${jobName}' failed`);
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
        log(`Job '${jobName}' errored: ${error.stack}`);
        log("Setting status to error");
        await reporter.setStatus("error");

        log("Posting error comment");
        await reporter.commitComment({ status: "error", error });
      });

      job.on("canceled", async () => {
        log(`Job '${jobName}' was canceled`);
        log("Setting status to canceled");
        await reporter.setStatus("canceled");

        log("Posting canceled comment");
        await reporter.commitComment({ status: "canceled" });
      });

      const { code } = await queue.add(job);
      log(`Job ${jobName} finished with status code ${code}`);
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
