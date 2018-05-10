/* @flow */
const spawn = require("spawndamnit");
const shell = require("shelljs");

module.exports = function runJob({
  remote,
  commitSha,
  jobName,
}: {
  remote: string,
  commitSha: string,
  jobName: string,
}): Promise<{ code: number, stdout: string, stderr: string, output: string }> {
  const now = Date.now();
  const jobDir = `jobs/${jobName}/${now}`;
  const runDir = `${jobDir}/${commitSha}`;
  const logFile = `${runDir}/quinci-log.txt`;

  shell.mkdir("-p", runDir);
  const child = spawn(
    "sh",
    [
      "-c",
      `git clone --quiet ${remote} ${commitSha} && ` +
        `cd ${commitSha} && ` +
        `git checkout --quiet ${commitSha} && ` +
        `./quinci/${jobName}`,
    ],
    {
      cwd: jobDir,
      env: Object.assign({}, process.env, {
        CI: "true",
        QUINCI_REMOTE: remote,
        QUINCI_JOB_NAME: jobName,
        QUINCI_COMMIT_SHA: commitSha,
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
    shell.rm("-rf", jobDir);
    return { code, stdout, stderr, output };
  });
};
