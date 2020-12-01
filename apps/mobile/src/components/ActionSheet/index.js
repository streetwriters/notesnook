import PropTypes from 'prop-types';
import React, {Component, createRef} from 'react';
import {
  Animated,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  StatusBar,
  TextInput,
  findNodeHandle,
  TouchableOpacity,
  UIManager,
  View,
  ViewPropTypes,

} from 'react-native';
import { notesnook } from '../../../e2e/test.ids';
import {dWidth} from '../../utils';
import {styles} from './styles';

var deviceHeight = getDeviceHeight();

function getDeviceHeight(statusBarTranslucent) {
  var height = Dimensions.get('window').height;

  if (Platform.OS === 'android' && !statusBarTranslucent) {
    return height - StatusBar.currentHeight;
  }

  return height;
}

const getElevation = (elevation) => {
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
      keyboard: false,
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
    this.targetId = null;
    this.offsetY = 0;
    this.borderRadius = new Animated.Value(10);
  }

  waitAsync = (ms) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });

  /**
   * Snap ActionSheet to Offset
   */

  snapToOffset = (offset) => {
    this._scrollTo(offset);
  };

  

  /**
   * Open/Close the ActionSheet
   */
  _setModalVisible = (visible) => {
    deviceHeight = getDeviceHeight(this.props.statusBarTranslucent);
    let modalVisible = this.state.modalVisible;
    if (visible !== undefined) {
      if (modalVisible === visible) {
        return;
      }
      modalVisible = !visible;
    }
    if (!modalVisible) {
      this.setState({
        modalVisible: true,
        scrollable: this.props.gestureEnabled,
      });
    } else {
      this._hideModal();
    }
  };

  _hideAnimation() {
    let {
      animated,
      closeAnimationDuration,
      onClose,
      closable,
      bottomOffset,
      initialOffsetFromBottom,
      extraScroll,
    } = this.props;
    Animated.parallel([
      Animated.timing(this.opacityValue, {
        toValue: closable ? 0 : 1,
        duration: animated ? closeAnimationDuration : 1,
        useNativeDriver: true,
      }),
      Animated.timing(this.transformValue, {
        toValue: closable ? this.customComponentHeight * 2 : 0,
        duration: animated ? closeAnimationDuration : 1,
        useNativeDriver: true,
      }),
    ]).start();

    this.waitAsync(closeAnimationDuration / 2).then(() => {
      let scrollOffset = closable
        ? 0
        : this.customComponentHeight * initialOffsetFromBottom +
          deviceHeight * 0.1 +
          extraScroll -
          bottomOffset;

      this._scrollTo(scrollOffset, !closable);

      this.setState(
        {
          modalVisible: !closable,
        },
        () => {
          this.isClosing = false;
          DeviceEventEmitter.emit('hasReachedTop', false);
          if (closable) {
            this.layoutHasCalled = false;
            if (typeof onClose === 'function') onClose();
          }
        },
      );
    });
  }

  _hideModal = () => {
    if (this.isClosing) return;
    this.isClosing = true;
    this._hideAnimation();
  };

  _showModal = async (event) => {
    let {
      gestureEnabled,
      initialOffsetFromBottom,
      footerHeight,
      footerAlwaysVisible,
      extraScroll,
      delayActionSheetDraw,
      delayActionSheetDrawTime,
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

      if (Platform.OS === 'ios') {
        await this.waitAsync(delayActionSheetDrawTime);
      } else {
        if (delayActionSheetDraw) {
          await this.waitAsync(delayActionSheetDrawTime);
        }
      }

      this._scrollTo(scrollOffset, false);
      this.prevScroll = scrollOffset;
      if (Platform.OS === 'ios') {
        await this.waitAsync(delayActionSheetDrawTime / 2);
      } else {
        if (delayActionSheetDraw) {
          await this.waitAsync(delayActionSheetDrawTime / 2);
        }
      }

      this._openAnimation(scrollOffset);

      if (!gestureEnabled) {
        DeviceEventEmitter.emit('hasReachedTop');
      }

      this.layoutHasCalled = true;
    }
  };

  _openAnimation = (scrollOffset) => {
    let {bounciness, bounceOnOpen, animated, openAnimationSpeed} = this.props;

    if (animated) {
      this.transformValue.setValue(scrollOffset);
      Animated.parallel([
        Animated.spring(this.transformValue, {
          toValue: 0,
          bounciness: bounceOnOpen ? bounciness : 1,
          speed: openAnimationSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(this.opacityValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      this.opacityValue.setValue(1);
    }
  };

  _onScrollBegin = async (event) => {};
  _onScrollBeginDrag = async (event) => {
    let verticalOffset = event.nativeEvent.contentOffset.y;
    this.prevScroll = verticalOffset;
  };

  _onScrollEnd = async (event) => {
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
        await this.waitAsync(300);
        this.isRecoiling = false;

        DeviceEventEmitter.emit('hasReachedTop', true);
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
        this._scrollTo(this.prevScroll);
        this.isRecoiling = true;
        await this.waitAsync(300);
        this.isRecoiling = false;
      }
    }
  };

  _scrollTo = (y, animated = true) => {
    this.scrollAnimationEndValue = y;

    this.scrollViewRef.current?._listRef._scrollRef.scrollTo({
      x: 0,
      y: this.scrollAnimationEndValue,
      animated: animated,
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

  getTarget = () => {
    return this.targetId;
  };

  childScrollHandler = () => {
    if (this.prevScroll - 200 > this.offsetY) {
      this._hideModal();
    } else {
      this._scrollTo(this.prevScroll);
    }
  };

  _onScroll = (event) => {
    this.targetId = event.nativeEvent.target;
    this.offsetY = event.nativeEvent.contentOffset.y;

    let addFactor = deviceHeight * 0.1;
    if (this.customComponentHeight + addFactor - this.offsetY < 50) {
      DeviceEventEmitter.emit('hasReachedTop', true);
    } else {
      DeviceEventEmitter.emit('hasReachedTop', false);
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

  componentDidMount() {
    Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      this._onKeyboardShow,
    );

    Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      this._onKeyboardHide,
    );
  }

  _onKeyboardShow = (e) => {
    this.setState({
      keyboard: true,
    });
    const ReactNativeVersion = require('react-native/Libraries/Core/ReactNativeVersion');

    let v = ReactNativeVersion.version.major + ReactNativeVersion.version.minor;
    v = parseInt(v);

    if (v >= 63 || Platform.OS === 'ios') {
      let keyboardHeight = e.endCoordinates.height;
      const {height: windowHeight} = Dimensions.get('window');

      const currentlyFocusedField = TextInput.State.currentlyFocusedInput
        ? findNodeHandle(TextInput.State.currentlyFocusedInput())
        : TextInput.State.currentlyFocusedField();

      if (!currentlyFocusedField) return;
      UIManager.measure(
        currentlyFocusedField,
        (originX, originY, width, height, pageX, pageY) => {
          const fieldHeight = height;
          const fieldTop = pageY;
          const gap = windowHeight - keyboardHeight - (fieldTop + fieldHeight);
          if (gap >= 0) {
            return;
          }
          Animated.timing(this.transformValue, {
            toValue: gap - 10,
            duration: 250,
            useNativeDriver: true,
          }).start();
        },
      );
    } else {
      Animated.timing(this.transformValue, {
        toValue: -10,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };

  _onKeyboardHide = () => {

    this.setState({
      keyboard: false,
    });
    this.opacityValue.setValue(1);
    Animated.timing(this.transformValue, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  componentWillUnmount() {
    Keyboard.removeListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      this._onKeyboardShow,
    );
    this.offsetY = 0;
    Keyboard.removeListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      this._onKeyboardHide,
    );
  }

  render() {
    let {scrollable, modalVisible, keyboard} = this.state;
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
      keyboardShouldPersistTaps,
      statusBarTranslucent,
    } = this.props;

    return (
      <Modal
        visible={modalVisible}
        animationType="none"
        supportedOrientations={SUPPORTED_ORIENTATIONS}
        onShow={onOpen}
        onRequestClose={this._onRequestClose}
        transparent={true}
        statusBarTranslucent={statusBarTranslucent}>
        <Animated.View
          style={[
            styles.parentContainer,
            {
              opacity: this.opacityValue,
              width: '100%',
            },
          ]}>
            {this.props.premium}
          <FlatList
            bounces={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            ref={this.scrollViewRef}
            scrollEventThrottle={1}
            showsVerticalScrollIndicator={false}
            onMomentumScrollBegin={this._onScrollBegin}
            onMomentumScrollEnd={this._onScrollEnd}
            scrollEnabled={scrollable && !keyboard}
            onScrollBeginDrag={this._onScrollBeginDrag}
            onScrollEndDrag={this._onScrollEnd}
            onTouchEnd={this._onTouchEnd}
            onScroll={this._onScroll}
            style={styles.scrollView}
            contentContainerStyle={{
              width: dWidth,
            }}
            data={['dummy']}
            keyExtractor={(item) => item}
            renderItem={({item, index}) => (
              <View
                style={{
                  width: '100%',
                }}>
                <Animated.View
                  onTouchStart={this._onTouchBackdrop}
                  onTouchMove={this._onTouchBackdrop}
                  onTouchEnd={this._onTouchBackdrop}
                  testID={notesnook.ids.default.actionsheetBackdrop}
                  style={{
                    height: '100%',
                    width: '100%',
                    position: 'absolute',
                    zIndex: 1,
                    backgroundColor: overlayColor,
                    opacity: defaultOverlayOpacity,
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
                      borderTopRightRadius:this.borderRadius,
                      borderTopLeftRadius:this.borderRadius
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
              </View>
            )}
          />
        </Animated.View>
      </Modal>
    );
  }
}

ActionSheet.defaultProps = {
  children: <View />,
  CustomFooterComponent: null,
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
  delayActionSheetDraw: false,
  delayActionSheetDrawTime: 50,
  openAnimationSpeed: 12,
  springOffset: 100,
  elevation: 5,
  initialOffsetFromBottom: 1,
  indicatorColor: '#f0f0f0',
  defaultOverlayOpacity: 0.3,
  overlayColor: 'black',
  closable: true,
  bottomOffset: 0,
  closeOnTouchBackdrop: true,
  onClose: () => {},
  onOpen: () => {},
  keyboardShouldPersistTaps: 'never',
  statusBarTranslucent: true,
};
ActionSheet.propTypes = {
  children: PropTypes.node,
  CustomHeaderComponent: PropTypes.node,
  CustomFooterComponent: PropTypes.node,
  extraScroll: PropTypes.number,
  footerAlwaysVisible: PropTypes.bool,
  headerAlwaysVisible: PropTypes.bool,
  containerStyle: ViewPropTypes.style,
  footerStyle: ViewPropTypes.style,
  footerHeight: PropTypes.number,
  animated: PropTypes.bool,
  closeOnPressBack: PropTypes.bool,
  delayActionSheetDraw: PropTypes.bool,
  delayActionSheetDrawTime: PropTypes.number,
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
  closable: PropTypes.bool,
  bottomOffset: PropTypes.number,
  overlayColor: PropTypes.string,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  keyboardShouldPersistTaps: PropTypes.oneOf(['always', 'default', 'never']),
  statusBarTranslucent: PropTypes.bool,
};
