/* @flow */
import type { IncomingMessage, ServerResponse } from "http";
const fs = require("fs");
const path = require("path");
const githubWebhookHandler = require("github-webhook-handler");
const makeDebug = require("debug");
const AppContext = require("./app-context");

export type WebhookHandler = ((
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
  webhookHandler: WebhookHandler,
  appContext: AppContext,
  makeLogger: (prefix: string) => (message: string) => void,
}) => void;

module.exports = function createWebhookHandler(
  appContext: AppContext
): WebhookHandler {
  const webhookHandler = githubWebhookHandler({
    path: "/",
    secret: fs
      .readFileSync(
        path.resolve(process.cwd(), appContext.config.webhookSecretFile),
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
    const debug = makeDebug(`quinci:${loggerName}`);
    const makeLogger = (prefix) => (msg) => debug(`${prefix}${msg}`);
    setupEvent({ webhookHandler, appContext, makeLogger });
  });

  return webhookHandler;
};
