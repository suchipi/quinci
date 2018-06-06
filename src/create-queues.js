/* @flow */
import type { NormalizedConfig } from "./normalize-config";
import type { JobRunResult } from "./job";
const PromiseQueue = require("promise-queue");
const Job = require("./job");

class Queue {
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
}

export type Queues = {
  getQueueForJobName(jobName: string): Queue,
  getAllJobsForQueues(): Array<{ jobName: string, jobs: Array<Job> }>,
};

module.exports = function createQueues(config: NormalizedConfig): Queues {
  const queues: { [jobName: string]: Queue } = {};

  ((Object.entries(config.queueConcurrency): any): Array<
    [string, number]
  >).forEach(([jobName, concurrency]) => {
    queues[jobName] = new Queue(concurrency);
  });

  return {
    getQueueForJobName(jobName: string) {
      const queue = queues[jobName];
      if (queue) {
        return queue;
      } else {
        const newQueue = new Queue(Infinity);
        queues[jobName] = newQueue;
        return newQueue;
      }
    },
    getAllJobsForQueues() {
      return ((Object.entries(queues): any): Array<[string, Queue]>).map(
        ([jobName, queue]) => ({
          jobName,
          jobs: queue.getJobs(),
        })
      );
    },
  };
};
