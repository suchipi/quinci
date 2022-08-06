/* @flow */
import type { SetupEventFunction } from "../create-webhook-handler";
const Job = require("../job");
const GithubReporter = require("../github-reporter");

module.exports = (branchName: string) =>
  (function setupEvent({ webhookHandler, appContext, makeLogger }) {
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

        const taskName = branchName;

        log("Received a push event");

        if (payload.ref !== `refs/heads/${branchName}`) {
          log(`Aborting because the push was not to ${branchName}`);
          return;
        }

        const job = new Job({
          taskName,
          commitSha: sha,
          remote: payload.repository.ssh_url,
        });

        reporter = new GithubReporter({
          appContext,
          githubApp,
          installationId: payload.installation.id,
          owner,
          repo,
          sha,
          job,
        });

        const queue = queues.getQueueForTaskName(taskName);
        log(
          `Queue concurrency for '${taskName}' is ${queue.getConcurrency()}.`
        );
        log(
          `There are ${queue.getRunning()} job(s) running in the '${taskName}' queue.`
        );
        log(
          `There are ${queue.getWaiting()} job(s) waiting in the '${taskName}' queue.`
        );

        if (!queue.canRunNow()) {
          log("Setting status to waiting");
          await reporter.setStatus("waiting");
        }

        job.on("running", async () => {
          log(`Running job for '${taskName}'`);
          log("Setting status to running");
          await reporter.setStatus("running");
        });

        job.on("success", async () => {
          log(`Job for '${taskName}' succeeded`);
          log("Setting status to success");
          await reporter.setStatus("success");
        });

        job.on("failure", async () => {
          log(`Job for '${taskName}' failed`);
          log("Setting status to failure");
          await reporter.setStatus("failure");

          log("Posting failure comment");
          await reporter.commitComment("failure");
        });

        job.on("error", async (error) => {
          log(
            `Job for '${taskName}' errored: ${
              error && error.stack ? error.stack : error
            }`
          );
          log("Setting status to error");
          await reporter.setStatus("error");

          log("Posting error comment");
          await reporter.commitComment("error", error);
        });

        job.on("canceled", async () => {
          log(`Job for '${taskName}' was canceled`);
          log("Setting status to canceled");
          await reporter.setStatus("canceled");

          log("Posting canceled comment");
          await reporter.commitComment("canceled");
        });

        const { code } = await queue.add(job);
        log(`Job ${taskName} finished with status code ${code}`);
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
          await reporter.commitComment("error", error);
        } else {
          log(
            "Could not set status and post comment because reporter was null."
          );
        }
      }
    });
  }: SetupEventFunction);
