import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import {styles} from './styles';
let scrollViewRef;
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

const ActionSheet = ({
  ref,
  children = <View />,
  animated = true,
  animationType = 'fade',
  closeOnPressBack = true,
  gestureEnabled = true,
  bounceOnOpen = true,
  bounceOffset = 20,
  springOffset = 50,
  elevation = 5,
  initialOffsetFromBottom = 0.6,
  indicatorColor = 'gray',
  customStyles = {backgroundColor: 'white'},
  overlayColor = 'rgba(0,0,0,0.3)',
  onClose = () => {},
  onOpen = () => {},
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [scrollable, setScrollable] = useState(false);
  const [layoutHasCalled, setLayoutHasCalled] = useState(false);

  ActionSheet.customComponentHeight;
  ActionSheet.prevScroll;
  ActionSheet.scrollAnimationEndValue;
  ActionSheet.hasBounced;

  const _setModalVisible = () => {
    if (!modalVisible) {
      setModalVisible(true);
      if (gestureEnabled) {
        setScrollable(true);
      }
    } else {
      _hideModal();
    }
  };

  const _hideModal = () => {
    _scrollTo(0);
    setTimeout(() => {
      setLayoutHasCalled(false);
      setModalVisible(false);
      ActionSheet.customComponentHeight = null;
      ActionSheet.prevScroll = null;
      ActionSheet.scrollAnimationEndValue = null;
      ActionSheet.hasBounced = null;
      if (typeof onClose === 'function') onClose();
    }, 150);
  };

  const _showModal = event => {
    if (layoutHasCalled) {
      return;
    } else {
      ActionSheet.customComponentHeight = event.nativeEvent.layout.height;
      let addFactor = deviceHeight * 0.1;
      _scrollTo(
        gestureEnabled
          ? ActionSheet.customComponentHeight * initialOffsetFromBottom +
              addFactor +
              bounceOffset
          : ActionSheet.customComponentHeight + bounceOffset,
      );

      setLayoutHasCalled(true);
    }
  };

  const _onScrollBeginDrag = event => {
    let verticalOffset = event.nativeEvent.contentOffset.y;
    ActionSheet.prevScroll = verticalOffset;
  };

  const _onScrollEndDrag = event => {
    let verticalOffset = event.nativeEvent.contentOffset.y;

    if (ActionSheet.prevScroll < verticalOffset) {
      if (verticalOffset - ActionSheet.prevScroll > springOffset * 0.75) {
        let addFactor = deviceHeight * 0.1;
        _scrollTo(ActionSheet.customComponentHeight + addFactor);
      } else {
        _scrollTo(ActionSheet.prevScroll);
      }
    } else {
      if (ActionSheet.prevScroll - verticalOffset > springOffset) {
        _hideModal();
      } else {
        _scrollTo(ActionSheet.prevScroll);
      }
    }
  };

  const _scrollTo = (y, bouncing) => {
    if (!bouncing && bounceOnOpen) {
      ActionSheet.scrollAnimationEndValue = y + bounceOffset;
    } else {
      ActionSheet.scrollAnimationEndValue = y;
    }
    ActionSheet.hasBounced = false;
    scrollViewRef.scrollTo({
      x: 0,
      y: ActionSheet.scrollAnimationEndValue,
      animated: true,
    });
  };

  const _onTouchMove = () => {
    setScrollable(false);
  };

  const _onTouchStart = () => {
    setScrollable(false);
  };

  const _onTouchEnd = () => {
    if (gestureEnabled) {
      setScrollable(true);
    }
  };

  const _onScrollEndAnimation = () => {
    if (!ActionSheet.hasBounced) {
      _scrollTo(ActionSheet.scrollAnimationEndValue - bounceOffset, true);
      ActionSheet.hasBounced = true;
    }
  };

  return (
    <Modal
      ref={ref}
      visible={modalVisible}
      animationType={animationType}
      animated={animated}
      onShow={() => onOpen}
      onRequestClose={() => {
        if (closeOnPressBack) _hideModal();
      }}
      transparent={true}>
      <View style={[styles.parentContainer, {backgroundColor: overlayColor}]}>
        <ScrollView
          bounces={false}
          ref={ref => (scrollViewRef = ref)}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollable}
          onScrollBeginDrag={_onScrollBeginDrag}
          onScrollEndDrag={_onScrollEndDrag}
          onMomentumScrollEnd={() => {
            if (bounceOnOpen) {
              _onScrollEndAnimation();
            }
          }}
          onScrollAnimationEnd={_onScrollEndAnimation}
          onTouchEnd={_onTouchEnd}
          overScrollMode="always"
          style={[styles.scrollview]}>
          <View
            onTouchMove={_onTouchMove}
            onTouchStart={_onTouchStart}
            onTouchEnd={_onTouchEnd}
            style={{
              height: deviceHeight * 1.1,
              width: '100%',
            }}>
            <TouchableOpacity
              onPress={_hideModal}
              onLongPress={_hideModal}
              style={{
                height: deviceHeight,
                width: '100%',
              }}
            />
          </View>
          <View
            onLayout={_showModal}
            style={[
              styles.container,
              customStyles,
              {...getElevation(elevation)},
            ]}>
            {gestureEnabled ? (
              <View
                style={[styles.indicator, {backgroundColor: indicatorColor}]}
              />
            ) : null}

            {children}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ActionSheet;
