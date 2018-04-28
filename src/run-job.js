const spawn = require("spawndamnit");
const shell = require("shelljs");

module.exports = function runJob({ remote, commitSha, jobName }) {
  const now = Date.now();
  const jobDir = `jobs/${jobName}/${now}`;
  const runDir = `${jobDir}/${commitSha}`;
  const logFile = `${runDir}/dumb-ci-log.txt`;

  shell.mkdir("-p", runDir);
  const child = spawn(
    "sh",
    [
      "-c",
      `git clone --quiet ${remote} ${commitSha} && cd ${commitSha} && git checkout --quiet ${commitSha} && ./dumb-ci/${jobName}`,
    ],
    {
      cwd: jobDir,
      env: Object.assign({}, process.env, {
        CI: "true",
        DUMB_CI_REMOTE: remote,
        DUMB_CI_JOB_NAME: jobName,
        DUMB_CI_COMMIT_SHA: commitSha,
      }),
    }
  );
  let output = "";

  child.on("stdout", (data) => {
    output += data.toString("utf-8");
    shell.echo(data.toString("utf-8")).toEnd(logFile);
  });
  child.on("stderr", (data) => {
    output += data.toString("utf-8");
    shell.echo(data.toString("utf-8")).toEnd(logFile);
  });

  return child.then(({ code, stdout, stderr }) => {
    return { code, stdout, stderr, output };
  });
};
