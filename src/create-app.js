/* @flow */
import type { NormalizedConfig } from "./normalize-config";
const fs = require("fs");
const path = require("path");
const githubApp = require("github-app");

export type App = any;

module.exports = function createApp(config: NormalizedConfig): App {
  const app = githubApp({
    id: config.appId,
    cert: fs.readFileSync(path.resolve(process.cwd(), config.appCert)),
  });

  return app;
};
