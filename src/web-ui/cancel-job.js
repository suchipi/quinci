/* @flow */
import type { IncomingMessage, ServerResponse } from "http";
const AppContext = require("../app-context");

const url = require("url");
const querystring = require("querystring");

module.exports = function cancelJob(
  appContext: AppContext,
  req: IncomingMessage,
  res: ServerResponse
) {
  const urlObj = url.parse(req.url);
  const query = urlObj.query;

  if (query == null) {
    res.statusCode = 400;
    res.write("Cancel job failed: missing jobId query param");
    res.end();
    return;
  }

  const queryParams = querystring.parse(query);
  const jobId = queryParams.jobId;

  if (jobId == null) {
    res.statusCode = 400;
    res.write("Cancel job failed: missing jobId query param");
    res.end();
    return;
  }

  const jobs = appContext.queues.getAllJobsByUid();
  const job = jobs[jobId];

  if (job == null) {
    res.statusCode = 400;
    res.write("Cancel job failed: Invalid jobId");
    res.end();
    return;
  }

  try {
    job.cancel();
    res.writeHead(302, {
      Location: "/",
    });
    res.end();
  } catch (err) {
    res.statusCode = 500;
    res.write("Cancel job failed: Internal server error");
    res.end();
  }
};
