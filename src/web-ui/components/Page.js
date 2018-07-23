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
              body {
                background-color: rgb(217, 227, 255);
                font-family: 'Roboto', sans-serif;
              }

              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }

              a {
                text-decoration: none;
              }

              a:hover {
                text-decoration: underline;
              }

              summary::-webkit-details-marker {
                display: none;
              }

              summary:first-of-type {
                list-style-type: none;
              }

              details .details-icon {
                transition: transform 100ms ease-in-out;
              }

              details[open] .details-icon {
                transform: rotate(90deg);
              }

              details pre {
                transform: scaleY(0);
                transform-origin: top;
                transition: transform 100ms ease-in-out;
              }

              details[open] pre {
                transform: scaleY(1);
              }

              svg {
                overflow: visible;
              }
            `}
          </style>
          <link
            href="https://fonts.googleapis.com/css?family=Roboto"
            rel="stylesheet"
          />
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
