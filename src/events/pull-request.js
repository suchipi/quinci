const runJob = require("../run-job");
const commentTemplates = require("../comment-templates");
const createStatus = require("../create-status");

module.exports = function setupEvent(handler, app, makeLogger) {
  handler.on("pull_request", async ({ payload }) => {
    const [owner, repo] = payload.repository.full_name.split("/");
    const sha = payload.pull_request.head.sha;
    const number = payload.number;
    const log = makeLogger(`${repo}/${owner} #${number} ${sha}: `);

    let github;
    const jobName = "pull-request";

    try {
      log("Received a pull_request event");

      if (payload.action !== "synchronize" && payload.action !== "opened") {
        log("Aborting because action was not 'synchronize' or 'opened'");
        return;
      }

      github = await app.asInstallation(payload.installation.id);

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
          number: payload.number,
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
          number: payload.number,
          body: commentTemplates.failure(jobName, output, code)
        });
      }
    } catch (error) {
      log("Error: " + error);
      if (github != null) {
        log("Setting status to error");
        await createStatus.error({
          github,
          jobName,
          owner,
          repo,
          sha
        });

        await log("Posting error comment");
        github.issues.createComment({
          owner,
          repo,
          number: payload.number,
          body: commentTemplates.error(jobName, error)
        });
      }
    }
  });
};
