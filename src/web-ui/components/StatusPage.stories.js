import React from "react";
import { storiesOf } from "@storybook/react";
// import { action } from "@storybook/addon-actions";
// import { linkTo } from "@storybook/addon-links";
const { HelmetProvider } = require("react-helmet-async");

import StatusPage from "./StatusPage";
const AppContext = require("../../app-context");
const Job = require("../../job");

storiesOf("StatusPage", module).add("default", () => {
  const appContext = new AppContext({
    appId: 12345,
    appCert: "/app-cert",
    webhookSecretFile: "/webhook-secret-file",
    port: 8080,
    queueConcurrency: {
      master: 1,
      "pull-request": 3,
    },
  });

  const masterQueue = appContext.queues.getQueueForTaskName("master");
  masterQueue.add(
    new Job({
      taskName: "master",
      status: "waiting",
    })
  );
  masterQueue.add(
    new Job({
      taskName: "master",
      status: "running",
      runResult: {
        output: `[0m[0m
[0m  Some test[0m

  [32m  âœ“[0m[90m it works[0m[31m (8257ms)[0m


[92m [0m[32m 1 passing[0m[90m (8s)[0m


[32m  ([4m[1mResults[22m[24m)[39m

[90m  â”Œ[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”[39m
[90m  â”‚[39m [90mTests:[39m        [32m1[39m                                [90mâ”‚[39m
[90m  â”‚[39m [90mPassing:[39m      [32m1[39m                                [90mâ”‚[39m
[90m  â”‚[39m [90mFailing:[39m      [32m0[39m                                [90mâ”‚[39m
[90m  â”‚[39m [90mPending:[39m      [32m0[39m                                [90mâ”‚[39m
[90m  â”‚[39m [90mSkipped:[39m      [32m0[39m                                [90mâ”‚[39m
[90m  â”‚[39m [90mScreenshots:[39m  [32m0[39m                                [90mâ”‚[39m
[90m  â”‚[39m [90mVideo:[39m        [32mfalse[39m                            [90mâ”‚[39m
[90m  â”‚[39m [90mDuration:[39m     [32m8 seconds[39m                        [90mâ”‚[39m
[90m  â”‚[39m [90mSpec Ran:[39m     [32msome_test.js[39m [90mâ”‚[39m
[90m  â””[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”€[39m[90mâ”˜[39m


[90m====================================================================================================[39m

[0m  ([4m[1mRun Finished[22m[24m)[0m
        `.repeat(4),
      },
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
    })
  );
  masterQueue.add(
    new Job({
      taskName: "master",
      status: "canceled",
      createdAt: new Date(Date.now() - 6 * 60 * 1000),
      startedAt: new Date(Date.now() - 6 * 60 * 1000),
      finishedAt: new Date(Date.now() - 5.5 * 60 * 1000),
      runResult: {
        output: "Running............",
      },
    })
  );
  masterQueue.add(
    new Job({
      taskName: "master",
      status: "success",
      runResult: {
        code: 0,
        output:
          "\n\n\u001B[1;33;40m 33;40  \u001B[1;33;41m 33;41  \u001B[1;33;42m 33;42  \u001B[1;33;43m 33;43  \u001B[1;33;44m 33;44  \u001B[1;33;45m 33;45  \u001B[1;33;46m 33;46  \u001B[1m\u001B[0\n\n\u001B[1;33;42m >> Tests OK\n\n",
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      finishedAt: new Date(Date.now() - 1.78 * 60 * 60 * 1000),
    })
  );
  masterQueue.add(
    new Job({
      taskName: "master",
      status: "failure",
      runResult: {
        code: 1,
        output: "Process was killed (Out of memory)",
      },
      createdAt: new Date(Date.now() - 7.23 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 7.23 * 60 * 60 * 1000),
      finishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    })
  );
  masterQueue.add(
    new Job({
      taskName: "master",
      status: "error",
      runResult: {
        code: -1,
        output: "",
      },
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      finishedAt: new Date(Date.now() - 24.9 * 60 * 60 * 1000),
    })
  );

  return (
    <HelmetProvider>
      <StatusPage appContext={appContext} />
    </HelmetProvider>
  );
});
