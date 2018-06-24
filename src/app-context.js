/* @flow */
import type { App } from "./create-app";
import type { Queues } from "./create-queues";
import type { NormalizedConfig } from "./normalize-config";
const createApp = require("./create-app");
const createQueues = require("./create-queues");

module.exports = class AppContext {
  app: App;
  queues: Queues;
  config: NormalizedConfig;

  constructor(config: NormalizedConfig) {
    this.config = config;
    this.app = createApp(config);
    this.queues = createQueues(config);
  }
};
