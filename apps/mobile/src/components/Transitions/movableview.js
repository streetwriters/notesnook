import React, {Component} from 'react';
import {PanResponder} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';

export default class MovableView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      panY: new Animated.Value(0),
      panX: new Animated.Value(0),
      scale: new Animated.Value(1),
      disabled: props.disabled,
      xOffset: 0,
      yOffset: 0
    };

    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: () => !this.state.disabled,
      onMoveShouldSetPanResponderCapture: () => !this.state.disabled,
      onPanResponderGrant: () => {
        Animated.timing(this.state.scale, {
          toValue: 1.03,
          duration: 600,
          easing: Easing.elastic(1)
        }).start();
        this.props.onDragStart();
      },
      onPanResponderMove: (event, state) => {
        this.state.panX.setValue(state.dx);
        this.state.panY.setValue(state.dy);
      },
      onPanResponderRelease: () => {
        Animated.timing(this.state.panX, {
          toValue: 0,
          duration: 600,
          easing: Easing.elastic(1)
        }).start();
        Animated.timing(this.state.panY, {
          toValue: 0,
          duration: 600,
          easing: Easing.elastic(1)
        }).start();

        Animated.timing(this.state.scale, {
          toValue: 1,
          duration: 600,
          easing: Easing.elastic(1)
        }).start();

        this.xOffset = 0;
        this.yOffset = 0;

        this.props.onDragEnd();
      }
    });
  }

  componentWillMount() {
    if (typeof this.props.onMove === 'function')
      this.state.pan.addListener(values => this.props.onMove(values));
    if (this.props.breath) {
      let value = 0;
      setInterval(() => {
        value = value === 1 ? 1.02 : 1;
        Animated.timing(this.state.scale, {
          toValue: value,
          duration: this.props.breathDuration | 1000,
          easing: Easing.inOut(Easing.ease)
        }).start();
      }, 1000);
    }
  }

  changeDisableStatus = () => {
    this.state.disabled = !this.state.disabled;
  };

  render() {
    return (
      <Animated.View
        {...this.panResponder.panHandlers}
        style={[
          this.props.style,
          {
            transform: [
              {
                scale: this.state.scale
              },
              {
                translateX: this.state.panX
              },
              {
                translateY: this.state.panY
              }
            ]
          }
        ]}>
        {this.props.children}
      </Animated.View>
    );
  }
}

MovableView.defaultProps = {
  onDragStart: () => {},
  onDragEnd: () => {},
  disabled: false
};
