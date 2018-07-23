/* @flow */
const React = require("react");
const AppContext = require("../../app-context");
const Page = require("./Page");

type Props = {
  appContext: AppContext,
  selectedJobUid: ?string,
};

module.exports = class App extends React.Component<Props> {
  render() {
    const { appContext, selectedJobUid } = this.props;

    return (
      <Page title="quinCI Status">
        {appContext.queues.getAllJobsForQueues().map(({ taskName, jobs }) => (
          <article key={taskName} id={`queue-${taskName}`}>
            <a href={`/#queue-${taskName}`}>
              <h2>{taskName}</h2>
            </a>
            {jobs.length > 0 ? (
              <ul
                style={{
                  listStyleType: "none",
                  padding: "0",
                }}
              >
                {jobs.map((job) => (
                  <li
                    key={job.uid}
                    id={`job-${job.uid}`}
                    style={{
                      backgroundColor: {
                        waiting: "#f5f5f5",
                        canceled: "#f5f5f5",
                        running: "#fffbd3",
                        success: "#dffbdf",
                        failure: "#ffe6e6",
                        error: "#ffe6e6",
                      }[job.status],
                      padding: "1em",
                      margin: "1em 0",
                      borderRadius: "4px",
                    }}
                  >
                    <a href={`/?${job.uid}#job-${job.uid}`}>
                      <h3 style={{ margin: "0" }}>
                        {job.createdAt.toString()}
                      </h3>
                    </a>
                    <p style={{ margin: "0.5em 0" }}>
                      Git SHA: {job.commitSha}
                    </p>
                    <p style={{ margin: "0.5em 0" }}>Status: {job.status}</p>
                    {job.status === "running" ? (
                      <p style={{ margin: "0.5em 0" }}>
                        <a href={`/cancel?jobId=${job.uid}`}>Cancel Job</a>
                      </p>
                    ) : (
                      <p style={{ margin: "0.5em 0" }}>
                        Exit Code: {job.runResult.code}
                      </p>
                    )}
                    <details open={selectedJobUid === job.uid}>
                      <summary>Output</summary>
                      <pre>
                        <code>{job.runResult.output}</code>
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              "No jobs yet"
            )}
          </article>
        ))}
      </Page>
    );
  }
};
