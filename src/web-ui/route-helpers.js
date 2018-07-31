/* @flow */
import type { NormalizedConfig } from "../normalize-config";

const Job = require("../job");

const pathFor = {
  jobStatus(job: Job): string {
    return `/?${job.uid}#job-${job.uid}`;
  },
  cancelJob(job: Job): string {
    return `/cancel?jobId=${job.uid}`;
  },
  queue(taskName: string): string {
    return `/#queue-${taskName}`;
  },
};

const urlFor = {
  jobStatus(config: NormalizedConfig, job: Job): string {
    return `${config.webURL}${pathFor.jobStatus(job)}`;
  },
  cancelJob(config: NormalizedConfig, job: Job): string {
    return `${config.webURL}${pathFor.cancelJob(job)}`;
  },
  queue(config: NormalizedConfig, taskName: string): string {
    return `${config.webURL}${pathFor.queue(taskName)}`;
  },
};

module.exports = { pathFor, urlFor };
