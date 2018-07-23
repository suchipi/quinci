/* @flow */
const Job = require("./job");

// A single job queue; for instance, the 'pull-request' queue
module.exports = class QueueShim {
  _concurrency: number;
  _jobs: Array<Job>;

  constructor(concurrency: number) {
    this._concurrency = concurrency;
    this._jobs = [];
  }

  // The max number of jobs that can run concurrently in this queue.
  getConcurrency(): number {
    return this._concurrency;
  }

  // The number of jobs that are currently running in this queue.
  getRunning(): number {
    return this._jobs.filter((job) => job.status === "running").length;
  }

  // The number of jobs that are currently waiting to run in this queue.
  getWaiting(): number {
    return this._jobs.filter((job) => job.status === "waiting").length;
  }

  // Whether a job could run immediately if it was pushed onto this queue.
  canRunNow(): boolean {
    return this.getWaiting() === 0 && this.getRunning() < this.getConcurrency();
  }

  // All the jobs associated with this queue, whether finished, running, or unstarted.
  // Only the last `JOBS_TO_RETAIN` are kept.
  getJobs(): Array<Job> {
    return this._jobs;
  }

  // Add a job to the queue. It may run now, or may run at some point in the
  // future; use `canRunNow()` to check.
  add(job: Job) {
    this._jobs.push(job);
  }
};
