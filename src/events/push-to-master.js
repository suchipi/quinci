const runJob = require("../run-job");
const commentTemplates = require("../comment-templates");
const createStatus = require("../create-status");

module.exports = function setupEvent(handler, app, makeLogger) {
  handler.on("push", async ({ payload }) => {
    const [owner, repo] = payload.repository.full_name.split("/");
    const sha = payload.head_commit.id;
    const log = makeLogger(`${repo}/${owner} ${sha}: `);

    let github;
    const jobName = "master";

    log("Received a push event");

    try {
      if (payload.ref !== "refs/heads/master") {
        log("Aborting because the push was not to master");
        return;
      }

      github = await app.asInstallation(payload.installation.id);
      log("Setting status to pending");
      await createStatus.running({
        github,
        jobName,
        owner,
        repo,
        sha,
      });

      log(`Running job '${jobName}'`);
      const { code, output } = await runJob({
        jobName,
        commitSha: sha,
        remote: payload.repository.ssh_url,
      });

      log(`Job ${jobName} finished with status code ${code}`);
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
      log("Error: " + error);
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
};
