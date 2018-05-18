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

  handler.on("issue_comment", async ({ payload }) => {
    try {
      [owner, repo] = payload.repository.full_name.split("/");
      number = payload.issue.number;
      log = makeLogger(`${repo}/${owner} #${number}: `);

      const jobName = "pull-request";

      log("Received a issue_comment event");

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

      const prResponse = await github.pullRequests.get({
        owner,
        repo,
        number,
      });
      sha = prResponse.data.head.sha;
      log = makeLogger(`${repo}/${owner} #${number} ${sha}: `);

      if (payload.action !== "created") {
        log("Aborting because action was not 'created'");
        return;
      }
      if (payload.comment.user.type === "Bot") {
        log("Aborting because user was a bot");
        return;
      }

      const matches = payload.comment.body.match(
        /quin+c[eyi]+.* (?:re)?(?:run|test)/i
      );
      if (!matches) {
        log("Aborting because comment body did not request a CI run");
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
          remote: prResponse.data.head.repo.ssh_url,
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
          number,
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
          number,
          body: commentTemplates.failure(jobName, output, code),
        });
      }
    } catch (error) {
      log("Error: " + error.stack);
      if (github != null && sha != null && jobName != null) {
        log("Setting status to error");
        await createStatus.error({
          github,
          jobName,
          owner,
          repo,
          sha,
        });

        log("Posting error comment");
        await github.issues.createComment({
          owner,
          repo,
          number,
          body: commentTemplates.error(jobName, error),
        });
      }
    }
  });
}: SetupEventFunction);
