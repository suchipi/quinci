module.exports = {
  running({ github, jobName, owner, repo, sha }) {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "pending",
      description: `Dumb CI - Running '${jobName}'`,
      context: `dumb-ci:${jobName}`
    });
  },
  success({ github, jobName, owner, repo, sha }) {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "success",
      description: `Dumb CI - '${jobName}' ran successfully`,
      context: `dumb-ci:${jobName}`
    });
  },
  failure({ github, jobName, owner, repo, sha }) {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "failure",
      description: `Dumb CI - '${jobName}' failed`,
      context: `dumb-ci:${jobName}`
    });
  },
  error({ github, jobName, owner, repo, sha }) {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "error",
      description: `Dumb CI - '${jobName}' errored`,
      context: `dumb-ci:${jobName}`
    });
  }
};
