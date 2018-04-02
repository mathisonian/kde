import React from 'react';

class TextContainer extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      windowSize: 1600
    }
  }
  componentDidMount() {
    this.setState({
      windowSize: window.innerWidth
    })
  }

  render() {
    const { idyll, children, className, hasError, updateProps, ...props } = this.props;
    const { styles, ...layout } = idyll.layout;
    const { styles: _, ...theme } = idyll.theme;
    const style = { ...layout, ...theme };
    const cn = (className || '') + ' idyll-text-container';
    if (this.state.windowSize < 800) {
      style.marginLeft = 0;
    }
    return (
      <div style={style} {...props} className={cn}>{children}</div>
    );
  }
}

export default TextContainer;
