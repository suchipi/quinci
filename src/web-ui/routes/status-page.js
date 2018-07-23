/* @flow */
import type { HTTPRequest, HTTPResponse } from "../../create-http-middleware";
const url = require("url");
const React = require("react");
const renderReact = require("../render-react");
const StatusPage = require("./../components/StatusPage");

module.exports = function statusPage(req: HTTPRequest, res: HTTPResponse) {
  const urlObj = url.parse(req.url);
  const selectedJobUid = urlObj.query;

  res.statusCode = 200;
  const html = renderReact(
    <StatusPage appContext={req.appContext} selectedJobUid={selectedJobUid} />
  );
  res.write(html);
  res.end();
};
