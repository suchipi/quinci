/* @flow */
import type { JobRunResult } from "./job";
const PromiseQueue = require("promise-queue");
const Job = require("./job");

module.exports = class Queue {
  _concurrency: number;
  _promiseQueue: PromiseQueue;
  _jobs: Array<Job>;

  constructor(concurrency: number) {
    this._concurrency = concurrency;
    this._promiseQueue = new PromiseQueue(concurrency, Infinity);
    this._jobs = [];
  }

  getConcurrency() {
    return this._concurrency;
  }

  getRunning() {
    const promiseQueue = this._promiseQueue;
    return promiseQueue.getPendingLength();
  }

  getWaiting() {
    const promiseQueue = this._promiseQueue;
    return promiseQueue.getQueueLength();
  }

  getJobs() {
    return this._jobs;
  }

  canRunNow() {
    return this.getWaiting() === 0 && this.getRunning() < this.getConcurrency();
  }

  add(job: Job): Promise<JobRunResult> {
    this._jobs.push(job);
    this._jobs.slice(-100);

    const promiseQueue = this._promiseQueue;
    return promiseQueue.add(() => job.run());
  }
};
