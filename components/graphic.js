const React = require('react');

class ScrollGraphic extends React.Component {
  render() {
    const { idyll, updateProps, hasError, ...props } = this.props;
    return (
      <div {...props} />
    );
  }
}

module.exports = ScrollGraphic;
