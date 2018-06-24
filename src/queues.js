/* @flow */
import type { NormalizedConfig } from "./normalize-config";
const Queue = require("./queue");
const Job = require("./job");

// An object which contains all the queues in the app.
module.exports = class Queues {
  _queuesMap: Map<string, Queue>;

  constructor(config: NormalizedConfig) {
    this._queuesMap = new Map();

    ((Object.entries(config.queueConcurrency): any): Array<
      [string, number]
    >).forEach(([jobName, concurrency]) => {
      this._queuesMap.set(jobName, new Queue(concurrency));
    });
  }

  getQueueForJobName(jobName: string): Queue {
    const queue = this._queuesMap.get(jobName);
    if (queue) {
      return queue;
    } else {
      const newQueue = new Queue(Infinity);
      this._queuesMap.set(jobName, newQueue);
      return newQueue;
    }
  }

  getAllJobsForQueues(): Array<{ jobName: string, jobs: Array<Job> }> {
    return Array.from(this._queuesMap).map(([jobName, queue]) => ({
      jobName,
      jobs: queue.getJobs(),
    }));
  }

  getAllJobsByUid(): { [uid: string]: Job } {
    const jobs = {};
    this._queuesMap.forEach((queue, jobName) => {
      queue.getJobs().forEach((job) => {
        jobs[job.uid] = job;
      });
    });
    return jobs;
  }
};
