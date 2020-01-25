import React, {Component} from 'react';
import {
  View,
  Animated,
  PanResponder,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {COLOR_SCHEME} from '../../common/common';

export default class PullToRefresh extends Component {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
    this.currentScrollValue = 0;
    this.prevScroll = 0;
    this.translateY = new Animated.Value(0);
    this.opacity = new Animated.Value(0);
    this.PanResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (event, gestureEvent) => true,
      onStartShouldSetPanResponder: (event, gestureEvent) => {
        return true;
      },
      onPanResponderMove: this.onPanResponderMove,
      onPanResponderRelease: this.onPanResponderRelease,
    });
    this.prevPull = 0;
  }

  onPanResponderMove = (event, gestureEvent) => {
    console.log(this.prevScroll);

    this.listRef.getScrollResponder().scrollTo({
      x: 0,
      y: this.prevScroll + gestureEvent.dy * -1,
      animated: true,
    });

    return;
    if (
      !this.state.refreshing &&
      gestureEvent.dy < 120 &&
      gestureEvent.dy + this.prevPull < 120 &&
      gestureEvent.dy > 0
    ) {
      if (gestureEvent.vy < 10) {
        this.translateY.setValue(gestureEvent.dy + this.prevPull);
      }

      let o = (gestureEvent.dy + this.prevPull) / 120;

      this.opacity.setValue(o * 1);
    }
  };
  setCurrentScrollValue(value) {
    this.currentScrollValue = value;
  }

  onPanResponderRelease = (event, gestureEvent) => {
    this.prevScroll = this.currentScrollValue;
    return;

    if (gestureEvent.dy > 80) {
      this.setState(
        {
          refreshing: true,
        },
        () => {
          setTimeout(() => {
            this.prevPull = 0;
            Animated.parallel([
              Animated.timing(this.opacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.spring(this.translateY, {
                toValue: 0,
                bounciness: 8,
                useNativeDriver: true,
              }),
            ]).start();
            setTimeout(() => {
              this.setState({
                refreshing: false,
              });
            }, 150);
          }, 400);
        },
      );

      this.prevPull = 80;
      Animated.parallel([
        Animated.timing(this.opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(this.translateY, {
          toValue: 80,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(this.opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(this.translateY, {
          toValue: 0,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  setListRef(ref) {
    this.listRef = ref;
  }

  render() {
    return (
      <View
        style={{
          marginTop: 155,
        }}>
        <Animated.View
          style={{
            height: 80,
            position: 'absolute',
            opacity: this.opacity,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {this.state.refreshing ? (
            <ActivityIndicator size={24} color={COLOR_SCHEME.accent} />
          ) : (
            <Animated.Text>Pull to refresh</Animated.Text>
          )}
        </Animated.View>
        <Animated.View
          {...this.PanResponder.panHandlers}
          style={{
            height: '90%',
            backgroundColor: 'white',
            transform: [
              {
                translateY: this.translateY,
              },
            ],
          }}>
          {this.props.children}
        </Animated.View>
      </View>
    );
  }
}
