/* @flow */
const React = require("react");

type Props = {
  children?: React.Node,
  style?: ?Object,
  tagName: string,
  elevation: number,
};

module.exports = class Material extends React.Component<Props> {
  static defaultProps = {
    tagName: "div",
    elevation: 5,
  };

  render() {
    const { children, style, tagName, elevation, ...attrs } = this.props;

    return React.createElement(tagName, {
      style: {
        borderRadius: "8px",
        backgroundColor: "white",
        boxShadow: `0 2px ${elevation}px rgba(0, 0, 0, 0.25)`,
        ...style,
      },
      children,
      ...attrs,
    });
  }
};
