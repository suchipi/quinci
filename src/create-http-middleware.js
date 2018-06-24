/* @flow */
import type { IncomingMessage, ServerResponse } from "http";
const debug = require("debug")("quinci:http");
const AppContext = require("./app-context");
const webUI = require("./web-ui");
const createWebhookHandler = require("./create-webhook-handler");

module.exports = function createHttpMiddleware(appContext: AppContext) {
  const webhookHandler = createWebhookHandler(appContext);

  return (req: IncomingMessage, res: ServerResponse) => {
    try {
      webhookHandler(req, res, () => {
        webUI(appContext, req, res, () => {
          res.statusCode = 400;
          res.end("400 Bad Request");
        });
      });
    } catch (err) {
      debug(
        "Error in HTTP request handler: " + (err && err.stack) ? err.stack : err
      );
      res.statusCode = 500;
      res.end("500 Internal Server Error");
    }
  };
};
