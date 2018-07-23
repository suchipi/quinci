/* @flow */
import type { HTTPRequest, HTTPResponse } from "../../create-http-middleware";

module.exports = function cancelJob(req: HTTPRequest, res: HTTPResponse) {
  const jobId = req.query.jobId;

  if (jobId == null) {
    res.statusCode = 400;
    res.write("Cancel job failed: missing jobId query param");
    res.end();
    return;
  }

  if (Array.isArray(jobId)) {
    res.statusCode = 400;
    res.write("Cancel job failed: Invalid jobId");
    res.end();
    return;
  }

  const jobs = req.appContext.queues.getAllJobsByUid();
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
