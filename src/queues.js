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
    >).forEach(([taskName, concurrency]) => {
      this._queuesMap.set(taskName, new Queue(concurrency));
    });
  }

  getQueueForTaskName(taskName: string): Queue {
    const queue = this._queuesMap.get(taskName);
    if (queue) {
      return queue;
    } else {
      const newQueue = new Queue(Infinity);
      this._queuesMap.set(taskName, newQueue);
      return newQueue;
    }
  }

  getAllQueues(): Array<[string, Queue]> {
    return Array.from(this._queuesMap);
  }

  getAllJobsForQueues(): Array<{ taskName: string, jobs: Array<Job> }> {
    return Array.from(this._queuesMap).map(([taskName, queue]) => ({
      taskName,
      jobs: queue.getJobs(),
    }));
  }

  getAllJobsByUid(): { [uid: string]: Job } {
    const jobs = {};
    this._queuesMap.forEach((queue, taskName) => {
      queue.getJobs().forEach((job) => {
        jobs[job.uid] = job;
      });
    });
    return jobs;
  }
};
