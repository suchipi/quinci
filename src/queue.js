/* @flow */
import type { JobRunResult } from "./job";
const PromiseQueue = require("promise-queue");
const Job = require("./job");

const JOBS_TO_RETAIN = 100;

// A single job queue; for instance, the 'pull-request' queue
module.exports = class Queue {
  _concurrency: number;
  _promiseQueue: PromiseQueue;
  _jobs: Array<Job>;

  constructor(concurrency: number) {
    this._concurrency = concurrency;
    this._promiseQueue = new PromiseQueue(concurrency, Infinity);
    this._jobs = [];
  }

  // The max number of jobs that can run concurrently in this queue.
  getConcurrency(): number {
    return this._concurrency;
  }

  // The number of jobs that are currently running in this queue.
  getRunning(): number {
    const promiseQueue = this._promiseQueue;
    return promiseQueue.getPendingLength();
  }

  // The number of jobs that are currently waiting to run in this queue.
  getWaiting(): number {
    const promiseQueue = this._promiseQueue;
    return promiseQueue.getQueueLength();
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
  add(job: Job): Promise<JobRunResult> {
    this._jobs.push(job);
    this._jobs.slice(-JOBS_TO_RETAIN);

    const promiseQueue = this._promiseQueue;
    return promiseQueue.add(() => job.run());
  }
};
