const stripAnsi = require("strip-ansi");

const MAX_COMMENT_SIZE = 65536;

module.exports = {
  running(jobName) {
    return `🕑 QuinCI is running '${jobName}'...\n`;
  },
  success(jobName, rawOutput) {
    const output = stripAnsi(rawOutput);

    const header =
      `✅ QuinCI run of job '${jobName}' passed.\n` +
      "<details>\n" +
      "<summary>Log output:</summary>\n" +
      "\n``````\n";
    const body = output.trim();
    const footer = "\n``````\n" + "</details>";

    return (
      header +
      body.slice(-(MAX_COMMENT_SIZE - header.length - footer.length)) +
      footer
    );
  },
  failure(jobName, rawOutput, code) {
    const output = stripAnsi(rawOutput);

    const header =
      `❌ QuinCI run of job '${jobName}' failed. Exit code was ${code}.\n` +
      "<details>\n" +
      "<summary>Log output:</summary>\n" +
      "\n``````\n";
    const body = output.trim();
    const footer = "\n``````\n" + "</details>";

    return (
      header +
      body.slice(-(MAX_COMMENT_SIZE - header.length - footer.length)) +
      footer
    );
  },
  error(jobName, error) {
    const header =
      `❌ QuinCI run of job '${jobName}' errored.\n` +
      "Error:\n" +
      "\n``````\n";
    const body = error.toString().trim();
    const footer = "\n``````\n" + "</details>";

    return (
      header +
      body.slice(-(MAX_COMMENT_SIZE - header.length - footer.length)) +
      footer
    );
  },
};
