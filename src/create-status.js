/* @flow */
type StatusInput = {
  github: any,
  jobName: string,
  owner: string,
  repo: string,
  sha: string,
};

module.exports = {
  waiting({ github, jobName, owner, repo, sha }: StatusInput): Promise<any> {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "pending",
      description: `QuinCI - '${jobName}' Waiting in queue`,
      context: `quinci:${jobName}`,
    });
  },
  running({ github, jobName, owner, repo, sha }: StatusInput): Promise<any> {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "pending",
      description: `QuinCI - Running '${jobName}'`,
      context: `quinci:${jobName}`,
    });
  },
  success({ github, jobName, owner, repo, sha }: StatusInput): Promise<any> {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "success",
      description: `QuinCI - '${jobName}' ran successfully`,
      context: `quinci:${jobName}`,
    });
  },
  failure({ github, jobName, owner, repo, sha }: StatusInput): Promise<any> {
    return github.repos.createStatus({
      owner,
      repo,
      sha,
      state: "failure",
      description: `QuinCI - '${jobName}' failed`,
      context: `quinci:${jobName}`,
    });
  },
  error({ github, jobName, owner, repo, sha }: StatusInput): Promise<any> {
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
