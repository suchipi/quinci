/* @flow */
import type { SetupEventFunction } from "../create-handler";
const runJob = require("../run-job");
const commentTemplates = require("../comment-templates");
const createStatus = require("../create-status");

module.exports = (function setupEvent({ handler, app, queues, makeLogger }) {
  let log;
  let github;
  let jobName;
  let owner;
  let repo;
  let sha;

  handler.on("push", async (event) => {
    try {
      const { payload } = event;
      [owner, repo] = payload.repository.full_name.split("/");
      sha = payload.after;
      log = makeLogger(`${repo}/${owner} ${sha}: `);

      jobName = "master";

      log("Received a push event");

      if (payload.ref !== "refs/heads/master") {
        log("Aborting because the push was not to master");
        return;
      }

      github = await app.asInstallation(payload.installation.id);

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
        await createStatus.waiting({
          github,
          jobName,
          owner,
          repo,
          sha,
        });
      }

      const { code, output } = await queue.add(async () => {
        log("Setting status to running");
        await createStatus.running({
          github,
          jobName,
          owner,
          repo,
          sha,
        });

        log(`Running job '${jobName}'`);
        return runJob({
          jobName,
          commitSha: sha,
          remote: payload.repository.ssh_url,
        });
      });

      log(`Job ${jobName} finished with status code ${code}`);

      log(`Reauthenticating GitHub Client`);
      github = await app.asInstallation(payload.installation.id);

      if (code === 0) {
        log("Setting status to success");
        createStatus.success({
          github,
          jobName,
          owner,
          repo,
          sha,
        });
      } else {
        log("Setting status to failure");
        await createStatus.failure({
          github,
          jobName,
          owner,
          repo,
          sha,
        });

        log("Posting failure comment");
        await github.repos.createCommitComment({
          owner,
          repo,
          sha,
          body: commentTemplates.failure(jobName, output, code),
        });
      }
    } catch (error) {
      log("Error: " + error.stack);
      if (github != null) {
        log("Setting status to error");
        await createStatus.error({
          github,
          jobName,
          owner,
          repo,
          sha,
        });

        log("Posting error comment");
        await github.repos.createCommitComment({
          owner,
          repo,
          sha,
          body: commentTemplates.error(jobName, error),
        });
      }
    }
  });
}: SetupEventFunction);
