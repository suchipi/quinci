const fs = require("fs");
const path = require("path");
const githubWebhookHandler = require("github-webhook-handler");
const createApp = require("./create-app");

module.exports = function createHandler(config) {
  const app = createApp(config);
  const handler = githubWebhookHandler({
    path: "/",
    secret: fs.readFileSync(
      path.resolve(process.cwd(), config.webhookSecretFile),
      "utf-8"
    )
  });

  const eventFiles = fs.readdirSync(path.join(__dirname, "events"));
  eventFiles.forEach(filename => {
    const setupEvent = require("./events/" + filename);
    const debug = require("debug")("dumb-ci:" + path.basename(filename, ".js"));
    const makeLogger = prefix => msg => debug(`${prefix}${msg}`);
    setupEvent(handler, app, makeLogger);
  });

  return handler;
};
