/* @flow */
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const { Helmet } = require("react-helmet");

module.exports = function renderReact(element: React.Element<any>): string {
  const reactMarkup = ReactDOMServer.renderToString(element);
  const helmet = Helmet.renderStatic();

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
