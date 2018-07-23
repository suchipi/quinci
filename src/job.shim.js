const EventEmitter = require("events");
const uid = require("uid");

module.exports = class JobShim extends EventEmitter {
  constructor(attrs) {
    super();
    this.uid = uid();
    this.remote = attrs.remote || "git@github.com:user/repo.git";
    this.commitSha = attrs.commitSha || "1234567890abcdef";
    this.taskName = attrs.taskName || "";
    this.status = "waiting";
    const defaultRunResult = {
      code: -1,
      stdout: "",
      stderr: "",
      output: "",
    };
    this.createdAt = new Date();

    Object.assign(this, attrs);
    if (attrs.runResult != null) {
      this.runResult = Object.assign({}, defaultRunResult, attrs.runResult);
    } else {
      this.runResult = defaultRunResult;
    }
  }
};
