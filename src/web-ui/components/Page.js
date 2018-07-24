/* @flow */
const React = require("react");
const { default: Helmet } = require("react-helmet-async");
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
          <meta charSet="utf-8" />
          <link
            href="https://fonts.googleapis.com/css?family=Roboto"
            rel="stylesheet"
          />
          <link href="/assets/global.css" rel="stylesheet" />
        </Helmet>
        <AppBar />

        <main
          style={{
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          {children}
        </main>
      </>
    );
  }
};
