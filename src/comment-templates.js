/* @flow */
const stripAnsi = require("strip-ansi");

const MAX_COMMENT_SIZE = 65536;

module.exports = {
  waiting(taskName: string): string {
    return `🕑 quinCI will run '${taskName}' once other '${taskName}' jobs finish.\n`;
  },
  running(taskName: string): string {
    return `🕑 quinCI is running '${taskName}'...\n`;
  },
  success(taskName: string, rawOutput: string): string {
    const output = stripAnsi(rawOutput);

    const header =
      `✅ quinCI run of '${taskName}' passed.\n` +
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
  failure(taskName: string, rawOutput: string, code: number): string {
    const output = stripAnsi(rawOutput);

    const header =
      `❌ quinCI run of '${taskName}' failed. Exit code was ${code}.\n` +
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
  error(taskName: string, error: Error): string {
    const header =
      `❌ quinCI run of '${taskName}' errored.\n` + "Error:\n" + "\n``````\n";
    const body = error.stack.trim();
    const footer = "\n``````\n" + "</details>";

    return (
      header +
      body.slice(0, MAX_COMMENT_SIZE - header.length - footer.length) +
      footer
    );
  },
  canceled(taskName: string) {
    return `🚫 quinCI run of '${taskName}' was canceled.`;
  },
};
