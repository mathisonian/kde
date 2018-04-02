const React = require('react');

const BLUE = '#090C9B';
const RED = '#B02E0C';

class Blue extends React.Component {
  render() {
    const { hasError, updateProps, children, ...props } = this.props;
    return (
      <span style={{color: BLUE, textDecoration: 'underline'}}>
        {children}
      </span>
    );
  }
}

module.exports = Blue;
