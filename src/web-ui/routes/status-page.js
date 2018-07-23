/* @flow */
import type { IncomingMessage, ServerResponse } from "http";
const url = require("url");
const React = require("react");
const renderReact = require("../render-react");
const AppContext = require("../../app-context");
const StatusPage = require("./../components/StatusPage");

module.exports = function statusPage(
  appContext: AppContext,
  req: IncomingMessage,
  res: ServerResponse
) {
  const urlObj = url.parse(req.url);
  const selectedJobUid = urlObj.query;

  res.statusCode = 200;
  const html = renderReact(
    <StatusPage appContext={appContext} selectedJobUid={selectedJobUid} />
  );
  res.write(html);
  res.end();
};
