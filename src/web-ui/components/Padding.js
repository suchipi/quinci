/* @flow */
const React = require("react");

type Props = {
  top?: number | string,
  right?: number | string,
  bottom?: number | string,
  left?: number | string,
  x?: number | string,
  y?: number | string,
  size?: number | string,
  children?: React.Node,
  tagName: string,
};

module.exports = class Padding extends React.Component<Props> {
  static defaultProps = {
    tagName: "div",
  };

  static asStyle(props: Props) {}

  render() {
    const {
      top,
      right,
      bottom,
      left,
      x,
      y,
      size,
      children,
      tagName: TagName,
    } = this.props;

    return (
      <TagName
        style={{
          paddingTop: top ?? y ?? size,
          paddingRight: right ?? x ?? size,
          paddingBottom: bottom ?? y ?? size,
          paddingLeft: left ?? x ?? size,
        }}
      >
        {children}
      </TagName>
    );
  }
};
