import React, { Component, createRef } from 'react';
import { Platform } from 'react-native';
import { Keyboard } from 'react-native';
import { FlatList, TextInput, View } from 'react-native';
import { DDS } from '../../services/DeviceDetection';
import { editing } from '../../utils';

export default class Tabs extends Component {
  constructor(props) {
    super(props);
    this.listRef = createRef();
    this.scrollOffset = this.props.offsets.a;
    this.page = 0;
    this.nextPage = 0;
    this.currentDrawerState = false;
    this.inputElement = createRef();
    this.keyboardState = false;
    this.scrollTimeout = null;
    this.scrollEnabled = true;
    this.responderAllowedScroll = false;
    this.moved = false;
    this.lastOffset = this.props.offsets.a;
    this.locked = false;
  }

  renderItem = ({ item, index }) => this.props.items[index];

  onMoveShouldSetResponder = event => {
    if (this.locked) return;
    if (this.responderAllowedScroll) return;
    this.lastOffset = this.scrollOffset;
    // let x = event.nativeEvent.pageX;
    // let y = event.nativeEvent.pageY;
    this.hideKeyboardIfVisible();
    let cOffset = this.scrollOffset.toFixed(0);
    let pOffset = this.props.offsets.b.toFixed(0);
    // let heightCheck = !editing.tooltip
    //   ? this.props.dimensions.height - 70
    //   : this.props.dimensions.height - 140;

    if (DDS.isLargeTablet()) {
      this.setScrollEnabled(false);
      this.responderAllowedScroll = true;
      return;
    }

    if (cOffset > pOffset - 50 || DDS.isSmallTab) {
      // if (
      //   (!DDS.isSmallTab && x > 50) ||
      //   y > heightCheck ||
      //   (DDS.isSmallTab && x > this.props.widths.b)
      // ) {
      this.responderAllowedScroll = false;
      this.setScrollEnabled(false);
      return;
      // } else {
      //   this.responderAllowedScroll = true;
      //   this.setScrollEnabled(true);
      //   return;
      // }
    }
    this.responderAllowedScroll = true;
  };

  openDrawer = () => {
    if (this.page === 0) {
      if (this.scrollOffset === 0) {
        this.goToIndex(1);
        this.currentDrawerState = false;
      } else {
        this.currentDrawerState = true;
        this.goToIndex(0);
      }
      this.props.onDrawerStateChange && this.props.onDrawerStateChange(this.currentDrawerState);
    }
  };

  closeDrawer = () => {
    if (this.page === 0) {
      this.goToIndex(1);
      this.currentDrawerState = false;
      this.props.onDrawerStateChange && this.props.onDrawerStateChange(this.currentDrawerState);
    }
  };

  hideKeyboardIfVisible(close) {
    if (!close && this.nextPage === 1) return;
    if (Platform.OS === 'ios') return;
    if (editing.movedAway) return;

    if (
      (editing.keyboardState || editing.isFocused) &&
      this.scrollOffset < this.props.offsets.b - 50
    ) {
      editing.keyboardState = false;
      Keyboard.dismiss();
    }
  }

  goToIndex(index, animated = true) {
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
      this.scrollEndTimeout = null;
    }
    let offset = 0;
    if (index === 1) {
      this.nextPage = 0;
      offset = this.props.offsets.a;
      this.setScrollEnabled(true);
    } else if (index === 2) {
      this.nextPage = 1;
      offset = this.props.offsets.b;
    } else {
      offset = 0;
      this.nextPage = 0;
    }

    this.listRef.current?.scrollToOffset({
      offset: offset,
      animated: animated
    });
  }

  setScrollEnabled = enabled => {
    this.scrollEnabled = enabled;
    this.locked = !enabled;
    this.listRef.current?.getNativeScrollRef().setNativeProps({
      scrollEnabled: enabled
    });
  };

  onTouchEnd = () => {
    if (this.locked) return;
    this.responderAllowedScroll = false;
    this.setScrollEnabled(true);
  };

  onScroll = event => {
    this.moved = true;
    this.scrollOffset = event.nativeEvent.contentOffset.x;
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
      this.scrollEndTimeout = null;
    }

    if (this.page === 1 && this.scrollOffset < this.props.offsets.b - 100) {
      this.nextPage = 0;
    } else {
      this.nextPage = 1;
    }
    this.props.onScroll(this.scrollOffset);
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
    this.scrollTimeout = setTimeout(() => {
      if (this.scrollOffset !== this.props.offsets.a && this.page === 1 && !this.scrollEnabled) {
        this.goToIndex(2, false);
      }
    }, 300);
  };

  goToPage = page => {
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
      this.scrollEndTimeout = null;
    }
    this.nextPage = page;
    if (page === 0) {
      this.scrollOffset = this.props.offsets.a;
      this.goToIndex(1);
    } else if (page === 1) {
      this.goToIndex(2);
    }
    if (this.page !== page) {
      this.props.onChangeTab({ i: page, from: this.page });
      this.page = page;
    }
  };

  keyExtractor = (item, index) => item;

  scrollEndTimeout = null;

  onScrollEnd = () => {
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
      this.scrollEndTimeout = null;
    }
    this.moved = false;
    this.responderAllowedScroll = false;
    let page = 0;

    if (this.scrollOffset > this.props.offsets.b - 100) {
      page = 1;
      this.nextPage = 1;
    } else {
      this.nextPage = 0;
    }

    let drawerState = page === 0 && this.scrollOffset < 150;
    if (drawerState !== this.currentDrawerState) {
      this.currentDrawerState = drawerState;
      this.props.onDrawerStateChange && this.props.onDrawerStateChange(this.currentDrawerState);
    }
    this.props.toggleOverlay(
      Math.floor(this.scrollOffset) < Math.floor(this.props.offsets.a - 10) ? true : false
    );
    if (this.page !== page) {
      this.scrollEndTimeout = setTimeout(() => {
        this.props.onChangeTab({ i: page, from: this.page });
        this.page = page;
      }, 50);
    }
  };

  onListTouchEnd = event => {
    if (this.locked) return;
    if (this.lastOffset < 30 && event) {
      let width = this.props.dimensions.width;
      let px = event.nativeEvent.pageX;
      if (px > width * 0.75 || (DDS.isSmallTab && px > this.props.widths.a)) {
        this.goToIndex(1);
        this.currentDrawerState = false;
        this.props.onDrawerStateChange && this.props.onDrawerStateChange(this.currentDrawerState);
      }
    }
  };

  render() {
    return (
      <View
        onTouchEnd={this.onTouchEnd}
        onMoveShouldSetResponderCapture={this.onMoveShouldSetResponder}
        onStartShouldSetResponderCapture={this.onMoveShouldSetResponder}
        style={{
          flex: 1
        }}
      >
        <TextInput
          ref={this.inputElement}
          style={{ height: 1, padding: 0, width: 1, position: 'absolute' }}
          blurOnSubmit={false}
        />
        <FlatList
          ref={this.listRef}
          horizontal
          onMomentumScrollEnd={this.onScrollEnd}
          onScrollAnimationEnd={this.onScrollEnd}
          keyExtractor={this.keyExtractor}
          onScroll={this.onScroll}
          bounces={false}
          bouncesZoom={false}
          onTouchEnd={this.onListTouchEnd}
          initialNumToRender={100}
          alwaysBounceHorizontal={false}
          scrollToOverflowEnabled={false}
          scrollsToTop={false}
          scrollEventThrottle={10}
          directionalLockEnabled
          overScrollMode="never"
          maxToRenderPerBatch={100}
          keyboardDismissMode="none"
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          disableIntervalMomentum={true}
          disableVirtualization={true}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToOffsets={[this.props.offsets.a, this.props.offsets.b, this.props.offsets.c]}
          contentOffset={{
            x: editing.movedAway ? this.props.offsets.a : this.props.offsets.b
          }}
          data={['drawer', 'navigation', 'editor']}
          renderItem={this.renderItem}
        />
      </View>
    );
  }
}

Tabs.defaultProps = {
  onDrawerStateChange: () => {}
};
