/* @flow */
const React = require("react");
const { Helmet } = require("react-helmet");
const AppBar = require("./AppBar");

type Props = {
  title?: string,
  children?: React.Node,
};

module.exports = class Page extends React.Component<Props> {
  render() {
    const { title, children } = this.props;

    return (
      <>
        <Helmet>
          {title ? <title>{title}</title> : null}
          <style>
            {`
              body, html {
                margin: 0;
              }
              * {
                box-sizing: border-box;
              }
            `}
          </style>
        </Helmet>
        <AppBar />
        <main style={{ maxWidth: "960px", padding: "5px", margin: "0 auto" }}>
          {children}
        </main>
      </>
    );
  }
};
