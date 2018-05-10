/* @flow */
import type { SetupEventFunction } from "../create-handler";
const runJob = require("../run-job");
const commentTemplates = require("../comment-templates");
const createStatus = require("../create-status");

module.exports = (function setupEvent({ handler, app, queues, makeLogger }) {
  handler.on("commit_comment", async ({ payload }) => {
    const [owner, repo] = payload.repository.full_name.split("/");
    const sha = payload.comment.commit_id;
    const log = makeLogger(`${repo}/${owner} ${sha}: `);

    let github;
    let jobName;

    try {
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
      jobName = matches[1];

      github = await app.asInstallation(payload.installation.id);
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
        await github.repos.createCommitComment({
          owner,
          repo,
          sha,
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
        await github.repos.createCommitComment({
          owner,
          repo,
          sha,
          body: commentTemplates.running(jobName),
        });
        return runJob({
          jobName,
          commitSha: sha,
          remote: payload.repository.ssh_url,
        });
      });
      log(`Job '${jobName}' finished with status code ${code}`);

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
        await github.repos.createCommitComment({
          owner,
          repo,
          sha,
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
        await github.repos.createCommitComment({
          owner,
          repo,
          sha,
          body: commentTemplates.failure(jobName, output, code),
        });
      }
    } catch (error) {
      log("Error: " + error);
      if (github != null && jobName != null) {
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
