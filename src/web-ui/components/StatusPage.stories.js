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
    })
  );

  return <StatusPage appContext={appContext} />;
});
