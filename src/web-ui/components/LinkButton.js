/* @flow */
const React = require("react");

type Props = {
  label: string,
  href: string,
};

module.exports = class Button extends React.Component<Props> {
  render() {
    const { label, href } = this.props;
    return (
      <a
        href={href}
        style={{
          color: "white",
          backgroundColor: "rgb(244, 67, 54)",
          padding: "8px",
          borderRadius: "4px",
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.15)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </a>
    );
  }
};
