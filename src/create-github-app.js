/* @flow */
import type { NormalizedConfig } from "./normalize-config";
const fs = require("fs");
const path = require("path");
const githubApp = require("github-app");

export type GithubApp = any;

module.exports = function createGithubApp(config: NormalizedConfig): GithubApp {
  return githubApp({
    id: config.appId,
    cert: fs.readFileSync(path.resolve(process.cwd(), config.appCert)),
  });
};
