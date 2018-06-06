/* @flow */
import type { SetupEventFunction } from "../create-handler";
const Job = require("../job");
const commentTemplates = require("../comment-templates");
const createStatus = require("../create-status");

module.exports = (function setupEvent({ handler, app, queues, makeLogger }) {
  let log;
  let github;
  let jobName;
  let owner;
  let repo;
  let sha;

  handler.on("commit_comment", async ({ payload }) => {
    try {
      [owner, repo] = payload.repository.full_name.split("/");
      sha = payload.comment.commit_id;
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

      const job = new Job({
        jobName,
        commitSha: sha,
        remote: payload.repository.ssh_url,
      });

      job.on("changing-status", async () => {
        log(`Reauthenticating GitHub Client`);
        github = await app.asInstallation(payload.installation.id);
      });

      job.on("running", async () => {
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
      });

      job.on("success", async () => {
        log(`Job '${jobName}' succeeded`);
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
          body: commentTemplates.success(jobName, job.runResult.output),
        });
      });

      job.on("failure", async () => {
        log(`Job '${jobName}' failed`);
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
          body: commentTemplates.failure(jobName, job.runResult.output, code),
        });
      });

      job.on("error", async (error) => {
        log(`Job '${jobName}' errored: ${error.stack}`);
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
      });

      const { code } = await queue.add(job);
      log(`Job '${jobName}' finished with status code ${code}`);
    } catch (error) {
      log(
        "Error in event handler: " + (error && error.stack)
          ? error.stack
          : error
      );
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
