/* @flow */
import type { IncomingMessage, ServerResponse } from "http";
const url = require("url");
const AppContext = require("../app-context");
const statusPage = require("./routes/status-page");
const cancelJob = require("./routes/cancel-job");

module.exports = function webUI(
  appContext: AppContext,
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  const urlObj = url.parse(req.url);
  if (req.method === "GET" && urlObj.pathname === "/") {
    statusPage(appContext, req, res);
  } else if (req.method === "GET" && urlObj.pathname === "/cancel") {
    cancelJob(appContext, req, res);
  } else {
    next();
  }
};
