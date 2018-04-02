const React = require('react');

const BLUE = '#090C9B';
const RED = '#B02E0C';

class Red extends React.Component {
  render() {
    const { hasError, updateProps, children, ...props } = this.props;
    return (
      <span style={{color: RED, textDecoration: 'underline'}}>
        {children}
      </span>
    );
  }
}

module.exports = Red;
