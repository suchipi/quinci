/* @flow */
import type { GithubApp } from "./create-github-app";
import type { NormalizedConfig } from "./normalize-config";
const createGithubApp = require("./create-github-app");
const Queues = require("./queues");

module.exports = class AppContext {
  githubApp: GithubApp;
  queues: Queues;
  config: NormalizedConfig;

  constructor(config: NormalizedConfig) {
    this.config = config;
    this.githubApp = createGithubApp(config);
    this.queues = new Queues(config);
  }
};
