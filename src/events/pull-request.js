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
  let number;

  handler.on("pull_request", async ({ payload }) => {
    try {
      [owner, repo] = payload.repository.full_name.split("/");
      sha = payload.pull_request.head.sha;
      number = payload.number;
      log = makeLogger(`${repo}/${owner} #${number} ${sha}: `);
      jobName = "pull-request";

      log("Received a pull_request event");

      if (payload.action !== "synchronize" && payload.action !== "opened") {
        log("Aborting because action was not 'synchronize' or 'opened'");
        return;
      }

      github = await app.asInstallation(payload.installation.id);

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

        log("Posting waiting comment");
        await github.issues.createComment({
          owner,
          repo,
          number,
          body: commentTemplates.waiting(jobName),
        });
      }

      const { code, output } = await queue.add(async () => {
        log(`Running job '${jobName}'`);
        log("Setting status to running");
        await createStatus.running({
          github,
          jobName,
          owner,
          repo,
          sha,
        });

        log("Posting running comment");
        await github.issues.createComment({
          owner,
          repo,
          number,
          body: commentTemplates.running(jobName),
        });

        return runJob({
          jobName,
          commitSha: sha,
          remote: payload.pull_request.head.repo.ssh_url,
        });
      });
      log(`Job '${jobName}' finished with status code ${code}`);

      log(`Reauthenticating GitHub Client`);
      github = await app.asInstallation(payload.installation.id);

      if (code === 0) {
        log("Setting status to success");
        await createStatus.success({
          github,
          jobName,
          owner,
          repo,
          sha,
        });

        log("Posting success comment");
        await github.issues.createComment({
          owner,
          repo,
          number: payload.number,
          body: commentTemplates.success(jobName, output),
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
        await github.issues.createComment({
          owner,
          repo,
          number: payload.number,
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

        await log("Posting error comment");
        github.issues.createComment({
          owner,
          repo,
          number: payload.number,
          body: commentTemplates.error(jobName, error),
        });
      }
    }
  });
}: SetupEventFunction);
