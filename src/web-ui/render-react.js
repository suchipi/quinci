/* @flow */
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const { HelmetProvider } = require("react-helmet-async");

module.exports = function renderReact(element: React.Element<any>): string {
  const helmetContext = {};
  const reactMarkup = ReactDOMServer.renderToString(
    <HelmetProvider context={helmetContext}>{element}</HelmetProvider>
  );
  const { helmet } = helmetContext;

  return `
    <!DOCTYPE html>
    <html ${helmet.htmlAttributes.toString()}>
      <head>
        ${helmet.title.toString()}
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
      </head>
      <body ${helmet.bodyAttributes.toString()}>
        <div id="root">
          ${reactMarkup}
        </div>
      </body>
    </html>
  `;
};
