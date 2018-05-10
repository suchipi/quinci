/* @flow */
const stripAnsi = require("strip-ansi");

const MAX_COMMENT_SIZE = 65536;

module.exports = {
  waiting(jobName: string): string {
    return `🕑 QuinCI will run '${jobName}' once other '${jobName}' jobs finish.\n`;
  },
  running(jobName: string): string {
    return `🕑 QuinCI is running '${jobName}'...\n`;
  },
  success(jobName: string, rawOutput: string): string {
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
  failure(jobName: string, rawOutput: string, code: number): string {
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
  error(jobName: string, error: Error): string {
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
