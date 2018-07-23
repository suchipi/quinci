import React from "react";
import { storiesOf } from "@storybook/react";
// import { action } from "@storybook/addon-actions";
// import { linkTo } from "@storybook/addon-links";

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
        output: "Hi this is output",
      },
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
    })
  );
  masterQueue.add(
    new Job({
      taskName: "master",
      status: "success",
      runResult: {
        code: 0,
        output: "Hi this is output",
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

  return <StatusPage appContext={appContext} />;
});
