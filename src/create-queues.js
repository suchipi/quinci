/* @flow */
import type { NormalizedConfig } from "./normalize-config";
const PromiseQueue = require("promise-queue");

class Queue {
  _concurrency: number;
  _promiseQueue: PromiseQueue;

  constructor(concurrency: number) {
    this._concurrency = concurrency;
    this._promiseQueue = new PromiseQueue(concurrency, Infinity);
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

  canRunNow() {
    return this.getWaiting() === 0 && this.getRunning() < this.getConcurrency();
  }

  add<ResolveType>(
    promiseFn: () => Promise<ResolveType>
  ): Promise<ResolveType> {
    const promiseQueue = this._promiseQueue;
    return promiseQueue.add(promiseFn);
  }
}

export type Queues = {
  getQueueForJobName(jobName: string): Queue,
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
  };
};
