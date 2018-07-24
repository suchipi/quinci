const EventEmitter = require("events");
const uid = require("uid");

function makeSha() {
  let str = "";
  while (str.length < 40) {
    str += Math.random()
      .toString(16)
      .replace(/[^a-z0-9]+/g, "");
  }
  return str.slice(0, 40);
}

module.exports = class JobShim extends EventEmitter {
  constructor(attrs) {
    super();
    this.uid = uid();
    this.remote = attrs.remote || "git@github.com:user/repo.git";
    this.commitSha = attrs.commitSha || makeSha();
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
      this.runResult = { ...defaultRunResult, ...attrs.runResult };
    } else {
      this.runResult = defaultRunResult;
    }
  }
};
