/* @flow */
const React = require("react");
const Job = require("../../job");
const Padding = require("./Padding");

type Props = {
  job: Job,
  isSelected: boolean,
};

module.exports = class JobRunOutput extends React.Component<Props> {
  render() {
    const { job, isSelected } = this.props;

    return (
      <details open={isSelected}>
        <summary>Output</summary>
        <Padding top={8}>
          <pre
            style={{
              padding: "8px",
              backgroundColor: "#262626",
              color: "white",
            }}
          >
            <code>{job.runResult.output}</code>
          </pre>
        </Padding>
      </details>
    );
  }
};
