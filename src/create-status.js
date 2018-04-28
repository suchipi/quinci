module.exports = {
  running({ github, jobName, owner, repo, sha }) {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "pending",
      description: `QuinCI - Running '${jobName}'`,
      context: `quinci:${jobName}`,
    });
  },
  success({ github, jobName, owner, repo, sha }) {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "success",
      description: `QuinCI - '${jobName}' ran successfully`,
      context: `quinci:${jobName}`,
    });
  },
  failure({ github, jobName, owner, repo, sha }) {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "failure",
      description: `QuinCI - '${jobName}' failed`,
      context: `quinci:${jobName}`,
    });
  },
  error({ github, jobName, owner, repo, sha }) {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "error",
      description: `QuinCI - '${jobName}' errored`,
      context: `quinci:${jobName}`,
    });
  },
};
