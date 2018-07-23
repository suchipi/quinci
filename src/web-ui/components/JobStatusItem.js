/* @flow */
const React = require("react");
const {
  GitCommitIcon,
  ClockIcon,
  BeakerIcon,
  CheckIcon,
  XIcon,
  CircleSlashIcon,
} = require("react-octicons");
const moment = require("moment");
const Job = require("../../job");
const Padding = require("./Padding");
const LinkButton = require("./LinkButton");

type Props = {
  job: Job,
  isSelected: boolean,
  withDivider: boolean,
};

const Divider = () => (
  <hr
    style={{
      height: "0px",
      borderTop: "1px solid rgba(0, 0, 0, 0.25)",
      borderRight: "none",
      borderBottom: "none",
      borderLeft: "none",
      marginLeft: "-8px",
    }}
  />
);

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1);

const LabelWithIcon = ({
  label,
  icon,
}: {
  label: React.Node,
  icon: React.Node,
}) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {icon}
    <Padding left={4}>{label}</Padding>
  </div>
);

module.exports = class JobStatusItem extends React.Component<Props> {
  render() {
    const { job, isSelected, withDivider } = this.props;

    const jobStatusBorderColor = {
      waiting: "rgb(231, 231, 231)",
      canceled: "rgb(231, 231, 231)",
      running: "rgb(255, 243, 128)",
      success: "rgb(135, 255, 135)",
      failure: "rgb(255, 151, 151)",
      error: "rgb(255, 151, 151)",
    }[job.status];

    const jobStatusIconColor = {
      waiting: "rgb(119, 119, 119)",
      canceled: "rgb(119, 119, 119)",
      running: "rgb(177, 160, 0)",
      success: "rgb(0, 171, 0)",
      failure: "rgb(198, 0, 0)",
      error: "rgb(198, 0, 0)",
    }[job.status];

    const JobStatusIcon = {
      waiting: ClockIcon,
      canceled: CircleSlashIcon,
      running: BeakerIcon,
      success: CheckIcon,
      failure: XIcon,
      error: XIcon,
    }[job.status];

    const createdAtRelative = capitalize(moment(job.createdAt).fromNow());

    return (
      <li
        key={job.uid}
        id={`job-${job.uid}`}
        style={{
          borderLeft: `8px solid ${jobStatusBorderColor}`,
          position: "relative",
        }}
      >
        <Padding size={8} left={16}>
          <a href={`/?${job.uid}#job-${job.uid}`}>
            <h3>{createdAtRelative}</h3>
          </a>
          <p style={{ margin: "8px 0" }} title="Git Commit SHA">
            <LabelWithIcon label={job.commitSha} icon={<GitCommitIcon />} />
          </p>
          <p style={{ margin: "8px 0" }}>
            <LabelWithIcon
              label={`${capitalize(job.status)}${
                job.status === "failure"
                  ? " - Exit Code: " + job.runResult.code
                  : ""
              }`}
              icon={<JobStatusIcon style={{ fill: jobStatusIconColor }} />}
            />
          </p>

          {job.runResult.output.trim().length > 0 ||
          job.status === "running" ? (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "flex-end",
              }}
            >
              {job.runResult.output.trim().length > 0 ? (
                <details
                  open={isSelected}
                  style={{ flexGrow: 1, padding: "8px 0" }}
                >
                  <summary>Output</summary>
                  <Padding top={8}>
                    <pre>
                      <code>{job.runResult.output}</code>
                    </pre>
                  </Padding>
                </details>
              ) : null}

              <div
                style={{
                  flexGrow: 0,
                  paddingBottom: "8px",
                }}
              >
                {job.status === "running" ? (
                  <LinkButton
                    href={`/cancel?jobId=${job.uid}`}
                    label="Cancel Job"
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </Padding>
        {withDivider ? <Divider /> : null}
      </li>
    );
  }
};
