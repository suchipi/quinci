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
          backgroundColor: "#f44336",
          padding: "12px",
          fontSize: "32px",
          color: "white",
        }}
      >
        <div style={{ maxWidth: "960px", padding: "5px", margin: "0 auto" }}>
          <a href={titleHref}>quinCI</a>
        </div>
      </div>
    );
  }
};
