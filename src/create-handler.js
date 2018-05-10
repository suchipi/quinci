/* @flow */
import type { App } from "./create-app";
import type { NormalizedConfig } from "./normalize-config";
import type { Queues } from "./create-queues";
import type { IncomingMessage, ServerResponse } from "http";
const fs = require("fs");
const path = require("path");
const githubWebhookHandler = require("github-webhook-handler");
const createApp = require("./create-app");
const createQueues = require("./create-queues");

export type Handler = ((
  req: IncomingMessage,
  res: ServerResponse,
  next: (err: ?Error) => void
) => void) & {
  on: (
    eventType: string,
    callback: (event: { payload: Object }) => ?mixed
  ) => void,
};

export type SetupEventFunction = ({
  handler: Handler,
  app: App,
  queues: Queues,
  makeLogger: (prefix: string) => (message: string) => void,
}) => void;

module.exports = function createHandler(config: NormalizedConfig): Handler {
  const app = createApp(config);
  const queues = createQueues(config);
  const handler = githubWebhookHandler({
    path: "/",
    secret: fs
      .readFileSync(
        path.resolve(process.cwd(), config.webhookSecretFile),
        "utf-8"
      )
      .trim(),
  });

  [
    {
      loggerName: "commit-comment",
      setupEvent: require("./events/commit-comment"),
    },
    {
      loggerName: "pull-request-comment",
      setupEvent: require("./events/pull-request-comment"),
    },
    {
      loggerName: "pull-request",
      setupEvent: require("./events/pull-request"),
    },
    {
      loggerName: "push-to-master",
      setupEvent: require("./events/push-to-master"),
    },
  ].forEach(({ loggerName, setupEvent }) => {
    const debug = require("debug")(`quinci:${loggerName}`);
    const makeLogger = (prefix) => (msg) => debug(`${prefix}${msg}`);
    setupEvent({ handler, app, queues, makeLogger });
  });

  return handler;
};
