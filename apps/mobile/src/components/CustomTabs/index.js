import React, { Component, createRef } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { editing } from '../../utils';

  
export default class CustomTabs extends Component {
    constructor(props) {
      super(props);
      this.listRef = createRef();
      this.scrollOffset = props.initialIndex === 0 ? 0 : this.props.offsets.a;
      this.page = 0;
      this.currentDrawerState = false;
      this.inputElement = createRef();
      this.keyboardState = false;
      this.scrollTimeout = null;
      this.scrollEnabled = true;
      this.responderAllowedScroll = false;
    }
  
  
    renderItem = ({item, index}) => this.props.items[index];
  
    onMoveShouldSetResponder = event => {
      if (this.responderAllowedScroll) return;
      let x = event.nativeEvent.pageX;
      let y = event.nativeEvent.pageY;
      this.hideKeyboardIfVisible();
      let cOffset = this.scrollOffset.toFixed(0);
      let pOffset = this.props.offsets.b.toFixed(0);
      let heightCheck = !editing.tooltip
        ? this.props.dimensions.height - 70
        : this.props.dimensions.height - 140;
  
      if (cOffset > pOffset - 50) {
        if (x > 50 || y > heightCheck) {
          this.responderAllowedScroll = false;
          this.setScrollEnabled(false);
          return;
        } else {
          this.responderAllowedScroll = true;
          this.setScrollEnabled(true);
          return;
        }
      }
      this.responderAllowedScroll = true;
    };
  
    openDrawer = () => {
      if (this.page === 0) {
        this.goToIndex(0);
      }
    };
  
    closeDrawer = () => {
      if (this.page === 0) {
        this.goToIndex(1);
      }
    };
  
    hideKeyboardIfVisible() {
      if ((editing.keyboardState || editing.isFocused) && this.scrollOffset < this.props.offsets.b - 50) {
        editing.isFocused = false;
        editing.keyboardState = false;
        this.inputElement.current?.focus();
        this.inputElement.current?.blur();
      }
    }
  
    goToIndex(index, animated = true) {
      this.listRef.current?.scrollToIndex({
        animated: animated,
        index: index,
        viewOffset: 0,
        viewPosition: 0,
      });
    }
  
    setScrollEnabled = enabled => {
      this.scrollEnabled = enabled;
      this.listRef.current?.getNativeScrollRef().setNativeProps({
        scrollEnabled: enabled,
      });
    };
  
    onTouchEnd = () => {
      this.responderAllowedScroll = false;
      this.setScrollEnabled(true)
    
    };
  
    onScroll = event => {
      this.scrollOffset = event.nativeEvent.contentOffset.x;
      if (this.page === 1) {
        this.hideKeyboardIfVisible();
      }
      this.props.onScroll(this.scrollOffset);
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = null;
      }
      this.scrollTimeout = setTimeout(() => {
        if (
          this.scrollOffset !== this.props.offsets.a &&
          this.page === 1 &&
          !this.scrollEnabled
        ) {
          this.goToIndex(2, false);
        }
      }, 300);
    };
  
    goToPage = page => {
      if (page === 0) {
        this.scrollOffset = this.props.offsets.a;
        this.hideKeyboardIfVisible();
        this.goToIndex(1);
      } else if (page === 1) {
        this.goToIndex(2);
      }
      if (this.page !== page) {
        this.props.onChangeTab({i: page, from: this.page});
        this.page = page;
      }
    };
  
    keyExtractor = (item, index) => item;
  
    onScrollEnd = event => {
      this.responderAllowedScroll = false;
      let page = 0;
      if (this.scrollOffset > this.props.offsets.b - 50) {
        page = 1;
      } else {
        this.hideKeyboardIfVisible();
      }
      let drawerState = page === 0 && this.scrollOffset < 10;
      if (drawerState !== this.currentDrawerState) {
        this.currentDrawerState = drawerState;
        this.props.onDrawerStateChange(this.currentDrawerState);
      }
      if (this.page !== page) {
        this.props.onChangeTab({i: page, from: this.page});
        this.page = page;
      }
    };
  
    render() {
      return (
        <View
          onTouchEnd={this.onTouchEnd}
          onMoveShouldSetResponderCapture={this.onMoveShouldSetResponder}
          onStartShouldSetResponderCapture={this.onMoveShouldSetResponder}
          style={{
            flex: 1,
          }}>
          <TextInput
            ref={this.inputElement}
            style={{height: 1, padding: 0, width: 1, position: 'absolute'}}
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
            initialNumToRender={100}
            alwaysBounceHorizontal={false}
            scrollToOverflowEnabled={false}
            scrollsToTop={false}
            scrollEventThrottle={1}
            directionalLockEnabled
            maintainVisibleContentPosition={true}
            overScrollMode="never"
            maxToRenderPerBatch={100}
            removeClippedSubviews={false}
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
            showsHorizontalScrollIndicator={false}
            disableIntervalMomentum={true}
            snapToOffsets={[
              this.props.offsets.a,
              this.props.offsets.b,
              this.props.offsets.c,
            ]}
            initialScrollIndex={this.props.initialIndex}
            data={['drawer', 'navigation', 'editor']}
            renderItem={this.renderItem}
          />
        </View>
      );
    }
  }

  CustomTabs.defaultProps = {
      onDrawerStateChange:() => {}
  }
  