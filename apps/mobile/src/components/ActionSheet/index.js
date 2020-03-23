import React, {Component, createRef} from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  DeviceEventEmitter,
} from 'react-native';
import PropTypes from 'prop-types';
import {styles} from './styles';

var deviceHeight = Dimensions.get('window').height;

const getElevation = elevation => {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: {width: 0.3 * elevation, height: 0.5 * elevation},
    shadowOpacity: 0.2,
    shadowRadius: 0.7 * elevation,
  };
};

const SUPPORTED_ORIENTATIONS = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
];

export default class ActionSheet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      scrollable: false,
      layoutHasCalled: false,
    };
    this.transformValue = new Animated.Value(0);
    this.opacityValue = new Animated.Value(0);
    this.customComponentHeight;
    this.prevScroll;
    this.scrollAnimationEndValue;
    this.hasBounced;
    this.scrollViewRef = createRef();
    this.layoutHasCalled = false;
    this.isClosing = false;
    this.isRecoiling = false;
  }

  waitAsync = ms =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });

  /**
   * Open/Close the ActionSheet
   */

  _setModalVisible = () => {
    deviceHeight = Dimensions.get('window').height;
    if (!this.state.modalVisible) {
      this.setState({
        modalVisible: true,
        scrollable: this.props.gestureEnabled,
      });
    } else {
      this._hideModal();
    }
  };

  _hideModal = () => {
    let {animated, closeAnimationDuration, onClose} = this.props;
    if (this.isClosing) return;
    this.isClosing = true;

    Animated.timing(this.transformValue, {
      toValue: this.customComponentHeight * 2,
      duration: animated ? closeAnimationDuration : 1,
      useNativeDriver: true,
    }).start(() => {
      this.scrollViewRef.current?.scrollTo({
        x: 0,
        y: 0,
        animated: false,
      });
      this.setState(
        {
          modalVisible: false,
        },
        () => {
          this.layoutHasCalled = false;
          this.isClosing = false;
          if (typeof onClose === 'function') onClose();
        },
      );
    });
  };

  _showModal = async event => {
    let {
      gestureEnabled,
      bounciness,
      initialOffsetFromBottom,
      bounceOnOpen,
      animated,
      footerHeight,
      footerAlwaysVisible,
      extraScroll,
      openAnimationSpeed,
    } = this.props;

    let addFactor = deviceHeight * 0.1;
    let height = event.nativeEvent.layout.height;
    if (this.layoutHasCalled) {
      let diff;
      if (height > this.customComponentHeight) {
        diff = height - this.customComponentHeight;
        this._scrollTo(this.prevScroll + diff);

        this.customComponentHeight = height;
      } else {
        diff = this.customComponentHeight - height;
        this._scrollTo(this.prevScroll - diff);
        this.customComponentHeight = height;
      }
      return;
    } else {
      if (footerAlwaysVisible) {
        this.customComponentHeight = height;
      } else {
        this.customComponentHeight = height - footerHeight;
      }

      if (this.customComponentHeight > deviceHeight) {
        this.customComponentHeight =
          (this.customComponentHeight -
            (this.customComponentHeight - deviceHeight)) *
          0.9;
      }

      let scrollOffset = gestureEnabled
        ? this.customComponentHeight * initialOffsetFromBottom +
          addFactor +
          extraScroll
        : this.customComponentHeight + addFactor + extraScroll;

      await this.waitAsync(50);
      this.scrollViewRef.current.scrollTo({
        x: 0,
        y: scrollOffset,
        animated: false,
      });
      await this.waitAsync(20);
      if (animated) {
        this.transformValue.setValue(scrollOffset);
        this.opacityValue.setValue(1);
        Animated.spring(this.transformValue, {
          toValue: 0,
          bounciness: bounceOnOpen ? bounciness : 1,
          speed: openAnimationSpeed,
          useNativeDriver: true,
        }).start();
      }

      if (!gestureEnabled) {
        DeviceEventEmitter.emit('hasReachedTop');
      }

      this.layoutHasCalled = true;
    }
  };

  _onScrollBegin = event => {
    let verticalOffset = event.nativeEvent.contentOffset.y;
    this.prevScroll = verticalOffset;
  };

  _onScrollEnd = async event => {
    let {springOffset, extraScroll} = this.props;

    let verticalOffset = event.nativeEvent.contentOffset.y;

    if (this.prevScroll < verticalOffset) {
      if (this.isRecoiling) return;
      if (verticalOffset - this.prevScroll > springOffset * 0.75) {
        this.isRecoiling = true;
        let addFactor = deviceHeight * 0.1;

        let scrollValue = this.customComponentHeight + addFactor + extraScroll;

        if (scrollValue > deviceHeight) {
          scrollValue = (scrollValue - (scrollValue - deviceHeight)) * 1;
        }

        this._scrollTo(scrollValue);
        await this.waitAsync(450);
        this.isRecoiling = false;

        DeviceEventEmitter.emit('hasReachedTop');
      } else {
        this._scrollTo(this.prevScroll);
      }
    } else {
      if (this.prevScroll - verticalOffset > springOffset) {
        if (this.isRecoiling) {
          return;
        }

        this._hideModal();
      } else {
        if (this.isRecoiling) {
          return;
        }
        this.isRecoiling = true;
        await this.waitAsync(450);
        this.isRecoiling = false;

        this._scrollTo(this.prevScroll);
      }
    }
  };

  _scrollTo = y => {
    this.scrollAnimationEndValue = y;
    this.scrollViewRef.current?.scrollTo({
      x: 0,
      y: this.scrollAnimationEndValue,
      animated: true,
    });
  };

  _onTouchMove = () => {
    if (this.props.closeOnTouchBackdrop) {
      this._hideModal();
    }
    this.setState({
      scrollable: false,
    });
  };

  _onTouchStart = () => {
    if (this.props.closeOnTouchBackdrop) {
      this._hideModal();
    }
    this.setState({
      scrollable: false,
    });
  };

  _onTouchEnd = () => {
    if (this.props.gestureEnabled) {
      this.setState({
        scrollable: true,
      });
    }
  };

  _onRequestClose = () => {
    if (this.props.closeOnPressBack) this._hideModal();
  };

  _onTouchBackdrop = () => {
    if (this.props.closeOnTouchBackdrop) {
      this._hideModal();
    }
  };
  render() {
    let {scrollable, modalVisible} = this.state;
    let {
      onOpen,
      overlayColor,
      gestureEnabled,
      elevation,
      indicatorColor,
      defaultOverlayOpacity,
      children,
      containerStyle,
      footerStyle,
      footerHeight,
      CustomHeaderComponent,
      CustomFooterComponent,
      headerAlwaysVisible,
    } = this.props;

    return (
      <Modal
        visible={modalVisible}
        animated={true}
        animationType="fade"
        supportedOrientations={SUPPORTED_ORIENTATIONS}
        onShow={() => onOpen}
        onRequestClose={this._onRequestClose}
        transparent={true}>
        <Animated.View style={styles.parentContainer}>
          <KeyboardAvoidingView
            style={{
              width: '100%',
            }}
            enabled={Platform.OS === 'ios'}
            behavior="position">
            <ScrollView
              bounces={false}
              ref={this.scrollViewRef}
              showsVerticalScrollIndicator={false}
              onMomentumScrollBegin={this._onScrollBegin}
              onMomentumScrollEnd={this._onScrollEnd}
              scrollEnabled={scrollable}
              onScrollBeginDrag={this._onScrollBegin}
              onScrollEndDrag={this._onScrollEnd}
              onTouchEnd={this._onTouchEnd}
              //onScroll={this._onScroll}
              style={styles.scrollView}>
              <Animated.View
                onTouchStart={this._onTouchBackdrop}
                onTouchMove={this._onTouchBackdrop}
                onTouchEnd={this._onTouchBackdrop}
                style={{
                  height: '100%',
                  width: '100%',
                  opacity: defaultOverlayOpacity,
                  position: 'absolute',
                  backgroundColor: overlayColor,
                  zIndex: 1,
                }}
              />
              <View
                onTouchMove={this._onTouchMove}
                onTouchStart={this._onTouchStart}
                onTouchEnd={this._onTouchEnd}
                style={{
                  height: deviceHeight * 1.1,
                  width: '100%',
                  zIndex: 10,
                }}>
                <TouchableOpacity
                  onPress={this._onTouchBackdrop}
                  onLongPress={this._onTouchBackdrop}
                  style={{
                    height: deviceHeight * 1.1,
                    width: '100%',
                  }}
                />
              </View>

              <Animated.View
                onLayout={this._showModal}
                style={[
                  styles.container,
                  containerStyle,
                  {
                    ...getElevation(elevation),
                    zIndex: 11,
                    opacity: this.opacityValue,
                    transform: [
                      {
                        translateY: this.transformValue,
                      },
                    ],
                  },
                ]}>
                {gestureEnabled || headerAlwaysVisible ? (
                  CustomHeaderComponent ? (
                    CustomHeaderComponent
                  ) : (
                    <View
                      style={[
                        styles.indicator,
                        {backgroundColor: indicatorColor},
                      ]}
                    />
                  )
                ) : null}

                {children}
                <View
                  style={[
                    {
                      width: '100%',
                      backgroundColor: 'transparent',
                    },
                    footerStyle,
                    {
                      height: footerHeight,
                    },
                  ]}>
                  {CustomFooterComponent}
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    );
  }
}

ActionSheet.defaultProps = {
  children: <View />,
  CustomFooterComponent: <View />,
  CustomHeaderComponent: null,
  footerAlwaysVisible: false,
  headerAlwaysVisible: false,
  containerStyle: {},
  footerHeight: 40,
  footerStyle: {},
  animated: true,
  closeOnPressBack: true,
  gestureEnabled: false,
  bounceOnOpen: false,
  bounciness: 8,
  extraScroll: 0,
  closeAnimationDuration: 300,
  openAnimationSpeed: 12,
  springOffset: 50,
  elevation: 5,
  initialOffsetFromBottom: 1,
  indicatorColor: 'gray',
  defaultOverlayOpacity: 0.3,
  overlayColor: 'black',
  closeOnTouchBackdrop: true,
  onClose: () => {},
  onOpen: () => {},
};
ActionSheet.propTypes = {
  children: PropTypes.node,
  CustomHeaderComponent: PropTypes.node,
  CustomFooterComponent: PropTypes.node,
  extraScroll: PropTypes.number,
  footerAlwaysVisible: PropTypes.bool,
  headerAlwaysVisible: PropTypes.bool,
  containerStyle: PropTypes.object,
  footerStyle: PropTypes.object,
  footerHeight: PropTypes.number,
  animated: PropTypes.bool,
  closeOnPressBack: PropTypes.bool,
  gestureEnabled: PropTypes.bool,
  closeOnTouchBackdrop: PropTypes.bool,
  bounceOnOpen: PropTypes.bool,
  bounciness: PropTypes.number,
  springOffset: PropTypes.number,
  defaultOverlayOpacity: PropTypes.number,
  closeAnimationDuration: PropTypes.number,
  openAnimationSpeed: PropTypes.number,
  elevation: PropTypes.number,
  initialOffsetFromBottom: PropTypes.number,
  indicatorColor: PropTypes.string,
  overlayColor: PropTypes.string,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
};
