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
      `git clone ${remote} ${commitSha} && cd ${commitSha} && git checkout ${commitSha} && ./dumb-ci/${jobName}`
    ],
    {
      cwd: jobDir
    }
  );
  let output = "";

  child.on("stdout", data => {
    output += data.toString("utf-8");
    shell.echo(data.toString("utf-8")).toEnd(logFile);
  });
  child.on("stderr", data => {
    output += data.toString("utf-8");
    shell.echo(data.toString("utf-8")).toEnd(logFile);
  });

  return child.then(({ code, stdout, stderr }) => {
    return { code, stdout, stderr, output };
  });
};
