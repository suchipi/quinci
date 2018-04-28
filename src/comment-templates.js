module.exports = {
  running(jobName) {
    return `🕑 QuinCI is running '${jobName}'...\n`;
  },
  success(jobName, output) {
    return (
      `✅ QuinCI run of job '${jobName}' passed.\n` +
      "<details>\n" +
      "<summary>Log output:</summary>\n" +
      "\n``````\n" +
      output +
      "\n``````\n" +
      "</details>"
    );
  },
  failure(jobName, output, code) {
    return (
      `❌ QuinCI run of job '${jobName}' failed. Exit code was ${code}.\n` +
      "<details>\n" +
      "<summary>Log output:</summary>\n" +
      "\n``````\n" +
      output +
      "\n``````\n" +
      "</details>"
    );
  },
  error(jobName, error) {
    return (
      `❌ QuinCI run of job '${jobName}' errored.\n` +
      "Error:\n" +
      "\n``````\n" +
      error.toString() +
      "\n``````\n"
    );
  },
};
