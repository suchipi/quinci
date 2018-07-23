/* @flow */
const React = require("react");
const {
  GitCommitIcon,
  ClockIcon,
  PrimitiveDotIcon,
  CheckIcon,
  XIcon,
  CircleSlashIcon,
  WatchIcon,
} = require("react-octicons");
const moment = require("moment");
const Job = require("../../job");
const Padding = require("./Padding");
const LabelWithIcon = require("./LabelWithIcon");
const JobRunOutput = require("./JobRunOutput");

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
      running: "rgb(227, 205, 0)",
      success: "rgb(0, 171, 0)",
      failure: "rgb(198, 0, 0)",
      error: "rgb(198, 0, 0)",
    }[job.status];

    const JobStatusIcon = {
      waiting: ClockIcon,
      canceled: CircleSlashIcon,
      running: PrimitiveDotIcon,
      success: CheckIcon,
      failure: XIcon,
      error: XIcon,
    }[job.status];

    const jobStatusLabel = {
      waiting: (
        <span>
          Waiting - <a href={`/cancel?jobId=${job.uid}`}>Cancel</a>
        </span>
      ),
      canceled: "Canceled",
      running: (
        <span>
          Running - <a href={`/cancel?jobId=${job.uid}`}>Cancel</a>
        </span>
      ),
      success: "Success",
      failure: `Failure - Exit Code: ${job.runResult.code}`,
      error: "Error",
    }[job.status];

    const createdAtRelative = capitalize(moment(job.createdAt).fromNow());
    let runDuration = null;
    if (job.startedAt != null) {
      const endTime = job.finishedAt ?? new Date();
      runDuration = capitalize(
        moment.duration(job.startedAt - endTime).humanize()
      );
    }

    return (
      <li
        key={job.uid}
        id={`job-${job.uid}`}
        style={{
          borderLeft: `8px solid ${jobStatusBorderColor}`,
          position: "relative",
        }}
      >
        <Padding size={16}>
          <a href={`/?${job.uid}#job-${job.uid}`}>
            <h3>{createdAtRelative}</h3>
          </a>
          <LabelWithIcon
            title="Git Commit SHA"
            label={job.commitSha}
            icon={<GitCommitIcon />}
          />
          <LabelWithIcon
            title="Job Status"
            label={jobStatusLabel}
            icon={<JobStatusIcon style={{ fill: jobStatusIconColor }} />}
          />
          {runDuration ? (
            <LabelWithIcon
              title="Run Duration"
              label={runDuration}
              icon={<WatchIcon />}
            />
          ) : null}

          {job.runResult.output.trim().length > 0 ? (
            <JobRunOutput job={job} isSelected={isSelected} />
          ) : null}
        </Padding>
        {withDivider ? <Divider /> : null}
      </li>
    );
  }
};
