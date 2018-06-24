/* @flow */
import type { GithubApp } from "./create-github-app";
import type { Queues } from "./create-queues";
import type { NormalizedConfig } from "./normalize-config";
const createGithubApp = require("./create-github-app");
const createQueues = require("./create-queues");

module.exports = class AppContext {
  githubApp: GithubApp;
  queues: Queues;
  config: NormalizedConfig;

  constructor(config: NormalizedConfig) {
    this.config = config;
    this.githubApp = createGithubApp(config);
    this.queues = createQueues(config);
  }
};
