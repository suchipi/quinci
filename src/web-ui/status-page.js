/* @flow */
import type { IncomingMessage, ServerResponse } from "http";
const url = require("url");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const AppContext = require("../app-context");
const StatusPage = require("./components/StatusPage");

module.exports = function statusPage(
  appContext: AppContext,
  req: IncomingMessage,
  res: ServerResponse
) {
  const urlObj = url.parse(req.url);
  const selectedJobUid = urlObj.query;

  res.statusCode = 200;
  const head = `
    <title>quinCI Job Status</title>
  `;
  const body = ReactDOMServer.renderToString(
    <StatusPage appContext={appContext} selectedJobUid={selectedJobUid} />
  );

  res.write(`
    <!DOCTYPE html>  <html>
      <head>
        ${head}
      </head>
      <body>
        ${body}
      </body>
    </html>
  `);
  res.end();
};
