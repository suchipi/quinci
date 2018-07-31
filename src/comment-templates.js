/* @flow */
const stripAnsi = require("strip-ansi");
const Job = require("./job");

const MAX_COMMENT_SIZE = 65536;

module.exports = {
  waiting(job: Job): string {
    return `🕑 quinCI will run '${job.taskName}' once other '${
      job.taskName
    }' jobs finish.\n`;
  },
  running(job: Job): string {
    return `🕑 quinCI is running '${job.taskName}'...\n`;
  },
  success(job: Job): string {
    const output = stripAnsi(job.runResult.output);

    const header =
      `✅ quinCI run of '${job.taskName}' passed.\n` +
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
  failure(job: Job): string {
    const output = stripAnsi(job.runResult.output);

    const header =
      `❌ quinCI run of '${job.taskName}' failed. Exit code was ${
        job.runResult.code
      }.\n` +
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
  error(taskName: string, error: ?Error): string {
    const header =
      `❌ quinCI run of '${taskName}' errored.\n` + "Error:\n" + "\n``````\n";
    const body = error ? error.stack.trim() : "(no error)";
    const footer = "\n``````\n" + "</details>";

    return (
      header +
      body.slice(0, MAX_COMMENT_SIZE - header.length - footer.length) +
      footer
    );
  },
  canceled(job: Job) {
    return `🚫 quinCI run of '${job.taskName}' was canceled.`;
  },
};
