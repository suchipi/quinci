/* @flow */
const React = require("react");
const Padding = require("./Padding");

const LabelWithIcon = ({
  label,
  icon,
  title,
  noMargin,
}: {
  label: React.Node,
  icon: React.Node,
  title?: string,
  noMargin?: boolean,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      margin: noMargin ? "" : "8px 0",
    }}
  >
    <div
      style={{
        height: "16px",
        width: "16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      title={title}
    >
      {icon}
    </div>
    <Padding left={4}>{label}</Padding>
  </div>
);

module.exports = LabelWithIcon;
