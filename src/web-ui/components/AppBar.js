/* @flow */
const React = require("react");

type Props = {
  titleHref?: string,
};

module.exports = class AppBar extends React.Component<Props> {
  render() {
    const { titleHref } = this.props;
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <a style={{ padding: "12px", fontSize: "0" }} href={titleHref}>
          <img
            style={{ height: "48px", padding: "0" }}
            src="/assets/logo.svg"
          />
        </a>
      </div>
    );
  }
};
