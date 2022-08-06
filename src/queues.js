/* @flow */
import type { NormalizedConfig } from "./normalize-config";
const Queue = require("./queue");
const Job = require("./job");

// An object which contains all the queues in the app.
module.exports = class Queues {
  _queuesMap: Map<string, Queue>;

  constructor(config: NormalizedConfig) {
    this._queuesMap = new Map();

    // Named branches have a default queue concurrency of 1.
    config.namedBranches.forEach((branchName) => {
      this._queuesMap.set(branchName, new Queue(1));
    });

    // But, they can be overridden via the queue concurrency config option.
    ((Object.entries(config.queueConcurrency): any): Array<
      [string, number]
    >).forEach(([taskName, concurrency]) => {
      // If this._queuesMap already has a queue associated with that task
      // (from the namedBranches default queue concurrency of 1), that
      // Queue object is replaced with one using the correct concurrency
      // value.
      this._queuesMap.set(taskName, new Queue(concurrency));
    });
  }

  getQueueForTaskName(taskName: string): Queue {
    const queue = this._queuesMap.get(taskName);
    if (queue) {
      return queue;
    } else {
      // Custom tasks (which weren't specified in the named branches) have a
      // queue concurrency of Infinity by default. This is a little confusing,
      // since named branch tasks have a concurrency of 1 by default, but
      // before named branches were added, the behavior was that custom tasks
      // had Infinity concurrency, so this preserves that behavior so we
      // don't need to do a breaking change.
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
