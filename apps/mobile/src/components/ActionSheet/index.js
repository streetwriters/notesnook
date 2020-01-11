import React, {Component} from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
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

export default class ActionSheet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      scrollable: false,
      layoutHasCalled: false,
    };
    this.customComponentHeight;
    this.prevScroll;
    this.scrollAnimationEndValue;
    this.hasBounced;
    this.scrollViewRef;
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
    this._scrollTo(0);
    setTimeout(() => {
      this.setState(
        {
          modalVisible: false,
          layoutHasCalled: false,
        },
        () => {
          if (typeof this.props.onClose === 'function') this.props.onClose();
        },
      );
    }, 150);
  };

  _showModal = event => {
    let {gestureEnabled, bounceOffset, initialOffsetFromBottom} = this.props;
    let addFactor = deviceHeight * 0.1;
    let height = event.nativeEvent.layout.height;
    console.log('layout called again');
    if (this.state.layoutHasCalled) {
      let diff;
      if (height > this.customComponentHeight) {
        diff = height - this.customComponentHeight;
        this._scrollTo(this.prevScroll + diff);
        console.log(this.prevScroll);
        this.customComponentHeight = height;
      } else {
        diff = this.customComponentHeight - height;
        this._scrollTo(this.prevScroll - diff);
        this.customComponentHeight = height;
      }
      return;
    } else {
      this.customComponentHeight = height;

      this._scrollTo(
        gestureEnabled
          ? this.customComponentHeight * initialOffsetFromBottom +
              addFactor +
              bounceOffset
          : this.customComponentHeight + bounceOffset,
      );
      this.setState({
        layoutHasCalled: true,
      });
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

  _scrollTo = (y, bouncing) => {
    let {bounceOffset, bounceOnOpen} = this.props;

    this.hasBounced = false;
    if (!bouncing && bounceOnOpen) {
      this.scrollAnimationEndValue = y + bounceOffset;
    } else {
      this.scrollAnimationEndValue = y;
    }

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

  _onScrollEndAnimation = event => {
    this.prevScroll = event.nativeEvent.contentOffset.y;

    let {bounceOffset, bounceOnOpen} = this.props;
    if (!this.hasBounced && bounceOnOpen) {
      this._scrollTo(this.scrollAnimationEndValue - bounceOffset, true);
      this.hasBounced = true;
    }
  };

  render() {
    let {scrollable, modalVisible} = this.state;
    let {
      animationType,
      animated,
      onOpen,
      closeOnPressBack,
      overlayColor,
      bounceOnOpen,
      gestureEnabled,
      elevation,
      indicatorColor,
      children,
      customStyles,
    } = this.props;

    return (
      <Modal
        visible={modalVisible}
        animationType={animationType}
        animated={animated}
        onShow={() => onOpen}
        onRequestClose={() => {
          if (closeOnPressBack) this._hideModal();
        }}
        transparent={true}>
        <View style={[styles.parentContainer, {backgroundColor: overlayColor}]}>
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
              onMomentumScrollEnd={this._onScrollEndAnimation}
              onScrollAnimationEnd={this._onScrollEndAnimation}
              onTouchEnd={this._onTouchEnd}
              overScrollMode="always"
              style={[styles.scrollview]}>
              <View
                onTouchMove={this._onTouchMove}
                onTouchStart={this._onTouchStart}
                onTouchEnd={this._onTouchEnd}
                style={{
                  height: deviceHeight * 1.1,
                  width: '100%',
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
              <View
                onLayout={this._showModal}
                style={[
                  styles.container,
                  customStyles,
                  {...getElevation(elevation)},
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
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  }
}

ActionSheet.defaultProps = {
  children: <View />,
  animated: true,
  animationType: 'fade',
  closeOnPressBack: true,
  gestureEnabled: true,
  bounceOnOpen: true,
  bounceOffset: 20,
  springOffset: 50,
  elevation: 5,
  initialOffsetFromBottom: 0.6,
  indicatorColor: 'gray',
  customStyles: {},
  overlayColor: 'rgba(0,0,0,0.3)',
  onClose: () => {},
  onOpen: () => {},
};
ActionSheet.propTypes = {
  children: PropTypes.node,
  animated: PropTypes.bool,
  animationType: PropTypes.oneOf(['none', 'slide', 'fade']),
  closeOnPressBack: PropTypes.bool,
  gestureEnabled: PropTypes.bool,
  bounceOnOpen: PropTypes.bool,
  bounceOffset: PropTypes.number,
  springOffset: PropTypes.number,
  elevation: PropTypes.number,
  initialOffsetFromBottom: PropTypes.number,
  indicatorColor: PropTypes.string,
  customStyles: PropTypes.object,
  overlayColor: PropTypes.string,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
};
