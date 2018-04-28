const runJob = require("../run-job");
const commentTemplates = require("../comment-templates");
const createStatus = require("../create-status");

module.exports = function setupEvent(handler, app, makeLogger) {
  handler.on("issue_comment", async ({ payload }) => {
    const [owner, repo] = payload.repository.full_name.split("/");
    const number = payload.issue.number;
    let log = makeLogger(`${repo}/${owner} #${number}: `);

    let github;
    let sha;
    const jobName = "pull-request";

    try {
      log("Received a issue_comment event");

      github = await app.asInstallation(payload.installation.id);
      const prResponse = await github.pullRequests.get({
        owner,
        repo,
        number
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

      const matches = payload.comment.body.match(/dumb.*ci.*(?:run|test)/i);
      if (!matches) {
        log("Aborting because comment body did not request a CI run");
        return;
      }

      log("Setting status to pending");
      await createStatus.running({
        github,
        jobName,
        owner,
        repo,
        sha
      });

      log("Posting pending comment");
      await github.issues.createComment({
        owner,
        repo,
        number,
        body: commentTemplates.running(jobName)
      });

      log(`Running job '${jobName}'`);
      const { code, output } = await runJob({
        jobName,
        commitSha: sha,
        remote: payload.repository.ssh_url
      });
      log(`Job '${jobName}' finished with status code ${code}`);

      if (code === 0) {
        log("Setting status to success");
        await createStatus.success({
          github,
          jobName,
          owner,
          repo,
          sha
        });

        log("Posting success comment");
        await github.issues.createComment({
          owner,
          repo,
          number,
          body: commentTemplates.success(jobName, output)
        });
      } else {
        log("Setting status to failure");
        await createStatus.failure({
          github,
          jobName,
          owner,
          repo,
          sha
        });

        log("Posting failure comment");
        await github.issues.createComment({
          owner,
          repo,
          number,
          body: commentTemplates.failure(jobName, output, code)
        });
      }
    } catch (error) {
      log("Error: " + error);
      if (github != null && sha != null && jobName != null) {
        log("Setting status to error");
        await createStatus.error({
          github,
          jobName,
          owner,
          repo,
          sha
        });

        log("Posting error comment");
        await github.issues.createComment({
          owner,
          repo,
          number,
          body: commentTemplates.error(jobName, error)
        });
      }
    }
  });
};
