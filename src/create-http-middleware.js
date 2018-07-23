/* @flow */
import type { express$Request, express$Response } from "express";
import type { IncomingMessage, ServerResponse } from "http";
const debug = require("debug")("quinci:http");
const AppContext = require("./app-context");
const webUI = require("./web-ui");
const createWebhookHandler = require("./create-webhook-handler");

export type HTTPRequest = express$Request & { appContext: AppContext };
export type HTTPResponse = express$Response;

module.exports = function createHttpMiddleware(appContext: AppContext) {
  const webhookHandler = createWebhookHandler(appContext);

  return (req: IncomingMessage, res: ServerResponse) => {
    try {
      webhookHandler(req, res, () => {
        // $FlowFixMe
        req.appContext = appContext;
        webUI(req, res);
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
