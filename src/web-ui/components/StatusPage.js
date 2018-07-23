/* @flow */
const React = require("react");
const AppContext = require("../../app-context");
const Page = require("./Page");
const JobStatusItem = require("./JobStatusItem");
const Material = require("./Material");
const Padding = require("./Padding");

type Props = {
  appContext: AppContext,
  selectedJobUid: ?string,
};

module.exports = class StatusPage extends React.Component<Props> {
  render() {
    const { appContext, selectedJobUid } = this.props;

    return (
      <Page title="quinCI Status">
        {appContext.queues.getAllJobsForQueues().map(({ taskName, jobs }) => (
          <Material
            tagName="article"
            key={taskName}
            id={`queue-${taskName}`}
            style={{
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <a
              href={`/#queue-${taskName}`}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                display: "block",
              }}
            >
              <Padding x={16} y={8}>
                <h2>{taskName}</h2>
              </Padding>
            </a>
            {jobs.length > 0 ? (
              <ul
                style={{
                  listStyleType: "none",
                  padding: "0",
                }}
              >
                {jobs.map((job, index) => (
                  <JobStatusItem
                    key={job.uid}
                    job={job}
                    isSelected={job.uid === selectedJobUid}
                    withDivider={jobs[index + 1] != null}
                  />
                ))}
              </ul>
            ) : (
              <Padding x={16} y={8}>
                No jobs have run in this queue yet.
              </Padding>
            )}
          </Material>
        ))}
      </Page>
    );
  }
};
