const fs = require("fs");
const path = require("path");
const githubApp = require("github-app");

module.exports = function createApp(config) {
  const app = githubApp({
    id: config.appId,
    cert: fs.readFileSync(path.resolve(process.cwd(), config.appCert))
  });

  return app;
};
