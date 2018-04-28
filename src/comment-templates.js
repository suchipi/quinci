module.exports = {
  running(jobName) {
    return `🕑 Dumb-CI is running '${jobName}'...\n`;
  },
  success(jobName, output) {
    return (
      `✅ Dumb-CI run of job '${jobName}' passed.\n` +
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
      `❌ Dumb-CI run of job '${jobName}' failed. Exit code was ${code}.\n` +
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
      `❌ Dumb-CI run of job '${jobName}' errored.\n` +
      "Error:\n" +
      "\n``````\n" +
      error.toString() +
      "\n``````\n"
    );
  }
};
