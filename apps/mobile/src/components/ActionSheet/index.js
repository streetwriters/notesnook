import React, {Component} from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import PropTypes from 'prop-types';
import {styles} from './styles';

const deviceHeight = Dimensions.get('window').height;

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
    this.containerOpacity = new Animated.Value(0);
    this.transformValue = new Animated.Value(0);
    this.opacity = new Animated.Value(0);
    this.customComponentHeight;
    this.prevScroll;
    this.scrollAnimationEndValue;
    this.hasBounced;
    this.scrollViewRef;
    this.layoutHasCalled = false;
    this.isClosing = false;
  }

  _setModalVisible = () => {
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

    Animated.parallel([
      Animated.timing(this.transformValue, {
        toValue: this.customComponentHeight * 2,
        duration: animated ? closeAnimationDuration : 1,
        useNativeDriver: true,
      }),
    ]).start(() => {
      this.scrollViewRef.scrollTo({
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

  _showModal = event => {
    let {
      gestureEnabled,
      bounciness,
      initialOffsetFromBottom,
      bounceOnOpen,
      animated,
      defaultOverlayOpacity,
      openAnimationDuration,
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
      this.customComponentHeight = height - 100;
      let scrollOffset = gestureEnabled
        ? this.customComponentHeight * initialOffsetFromBottom + addFactor
        : this.customComponentHeight + addFactor;

      this.scrollViewRef.scrollTo({
        x: 0,
        y: scrollOffset,
        animated: false,
      });

      if (animated) {
        this.transformValue.setValue(scrollOffset);
        Animated.parallel([
          Animated.spring(this.transformValue, {
            toValue: 0,
            bounciness: bounceOnOpen ? bounciness : 1,
            useNativeDriver: true,
          }).start(),
        ]).start();
      }

      this.layoutHasCalled = true;
    }
  };

  _onScrollBeginDrag = event => {
    let verticalOffset = event.nativeEvent.contentOffset.y;
    this.prevScroll = verticalOffset;
  };

  _onScrollEndDrag = event => {
    let {springOffset} = this.props;

    let verticalOffset = event.nativeEvent.contentOffset.y;

    if (this.prevScroll < verticalOffset) {
      if (verticalOffset - this.prevScroll > springOffset * 0.75) {
        let addFactor = deviceHeight * 0.1;
        this._scrollTo(this.customComponentHeight + addFactor);
      } else {
        this._scrollTo(this.prevScroll);
      }
    } else {
      if (this.prevScroll - verticalOffset > springOffset) {
        this._hideModal();
      } else {
        this._scrollTo(this.prevScroll);
      }
    }
  };

  _scrollTo = y => {
    this.scrollAnimationEndValue = y;
    this.scrollViewRef.scrollTo({
      x: 0,
      y: this.scrollAnimationEndValue,
      animated: true,
    });
  };

  _onTouchMove = () => {
    this._hideModal();
    this.setState({
      scrollable: false,
    });
  };

  _onTouchStart = () => {
    this._hideModal();
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

  render() {
    let {scrollable, modalVisible} = this.state;
    let {
      onOpen,
      closeOnPressBack,
      overlayColor,
      gestureEnabled,
      elevation,
      indicatorColor,
      defaultOverlayOpacity,
      children,
      customStyles,
    } = this.props;

    return (
      <Modal
        visible={modalVisible}
        animated={true}
        animationType="fade"
        supportedOrientations={SUPPORTED_ORIENTATIONS}
        onShow={() => onOpen}
        onRequestClose={() => {
          if (closeOnPressBack) this._hideModal();
        }}
        transparent={true}>
        <Animated.View style={[styles.parentContainer]}>
          <KeyboardAvoidingView
            style={{
              width: '100%',
            }}
            enabled={Platform.OS === 'ios' ? true : false}
            behavior="position">
            <ScrollView
              bounces={false}
              ref={ref => (this.scrollViewRef = ref)}
              showsVerticalScrollIndicator={false}
              scrollEnabled={scrollable}
              onScrollBeginDrag={this._onScrollBeginDrag}
              onScrollEndDrag={this._onScrollEndDrag}
              onTouchEnd={this._onTouchEnd}
              overScrollMode="always"
              style={[styles.scrollview]}>
              <Animated.View
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
                  onPress={this._hideModal}
                  onLongPress={this._hideModal}
                  style={{
                    height: deviceHeight,
                    width: '100%',
                  }}
                />
              </View>

              <Animated.View
                onLayout={this._showModal}
                style={[
                  styles.container,
                  customStyles,
                  {
                    ...getElevation(elevation),
                    zIndex: 11,
                    transform: [
                      {
                        translateY: this.transformValue,
                      },
                    ],
                  },
                ]}>
                {gestureEnabled ? (
                  <View
                    style={[
                      styles.indicator,
                      {backgroundColor: indicatorColor},
                    ]}
                  />
                ) : null}

                {children}
                <View
                  style={[
                    {
                      height: 100,
                      width: '100%',
                      backgroundColor: 'white',
                    },
                    customStyles,
                  ]}
                />
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
  animated: true,
  closeOnPressBack: true,
  gestureEnabled: false,
  bounceOnOpen: false,
  bounciness: 8,
  closeAnimationDuration: 300,
  openAnimationDuration: 200,
  springOffset: 50,
  elevation: 5,
  initialOffsetFromBottom: 1,
  indicatorColor: 'gray',
  customStyles: {},
  defaultOverlayOpacity: 0.3,
  overlayColor: 'black',
  onClose: () => {},
  onOpen: () => {},
};
ActionSheet.propTypes = {
  children: PropTypes.node,
  animated: PropTypes.bool,
  closeOnPressBack: PropTypes.bool,
  gestureEnabled: PropTypes.bool,
  bounceOnOpen: PropTypes.bool,
  bounciness: PropTypes.number,
  springOffset: PropTypes.number,
  defaultOverlayOpacity: PropTypes.number,
  closeAnimationDuration: PropTypes.number,
  openAnimationDuration: PropTypes.number,
  elevation: PropTypes.number,
  initialOffsetFromBottom: PropTypes.number,
  indicatorColor: PropTypes.string,
  customStyles: PropTypes.object,
  overlayColor: PropTypes.string,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
};
