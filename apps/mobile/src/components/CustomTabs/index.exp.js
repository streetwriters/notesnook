import React, {Component, createRef} from 'react';
import {Animated, FlatList, PanResponder, TextInput, View} from 'react-native';
import {editing} from '../../utils';

export default class CustomTabs extends Component {
  constructor(props) {
    super(props);
    this.listRef = createRef();
    this.scrollOffset = props.initialIndex === 0 ? 0 : this.props.offsets.a;
    this.page = 0;
    this.nextPage = 0;
    this.currentDrawerState = false;
    this.inputElement = createRef();
    this.keyboardState = false;
    this.scrollTimeout = null;
    this.scrollEnabled = true;
    this.responderAllowedScroll = false;
    this.lastOffset = props.initialIndex === 0 ? 0 : this.props.offsets.a;
    this.moved = false;
    this.state ={
      scrollValue: new Animated.Value(this.props.offsets.a)
    }
  }

  renderItem = ({item, index}) => this.props.items[index];

  onMoveShouldSetResponder = event => {
    if (this.responderAllowedScroll) return;
    this.lastOffset = this.scrollOffset;
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
    if (this.nextPage === 1) return;
    if (
      (editing.keyboardState || editing.isFocused) &&
      this.scrollOffset < this.props.offsets.b - 50
    ) {
      editing.isFocused = false;
      editing.keyboardState = false;
      this.inputElement.current?.focus();
      this.inputElement.current?.blur();
    }
  }

  goToIndex(index, animated = true) {
    let offset = 0;

    if (index === 1) {
      this.nextPage = 0;
      offset = this.props.offsets.a;
    } else if (index === 2) {
      this.nextPage = 1;
      offset = this.props.offsets.b;
    } else {
      offset = 0;
      this.nextPage = 0;
    }

    this.listRef.current?.scrollToOffset({
      offset: offset,
      animated: animated,
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
    this.setScrollEnabled(true);
  };

  onScroll = event => {
    this.moved = true;
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
    this.nextPage = page;
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
    this.moved = false;
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
    //console.log('ending', page, this.page);
    this.props.toggleOverlay(
      this.scrollOffset < this.props.offsets.a ? true : false,
    );
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

        <Animated.FlatList
          ref={this.listRef}
          horizontal
          onMomentumScrollEnd={this.onScrollEnd}
          onScrollAnimationEnd={this.onScrollEnd}
          onScrollEndDrag={this.onScrollEnd}
          keyExtractor={this.keyExtractor}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: this.state.scrollValue, }, }, }, ],
            { useNativeDriver: true, listener: this.onScroll, }
          )}
          bounces={false}
          onStartShouldSetResponder={() => false}
          onMoveShouldSetResponderCapture={(event) => {
            return false;
          }}
          decelerationRate="fast"
          snapToAlignment="start"
          disableIntervalMomentum
          onTouchEnd={(event) => {
            console.log('released',this.moved);
            if (this.lastOffset < 30) {
              if (event.nativeEvent.pageX > this.props.dimensions.width * 0.75) {
                this.goToIndex(1);
              }
            }
            return;
            if (!this.moved) return;
            let offsets = this.props.offsets;
            let scroll = this.scrollOffset;
            console.log(this.lastOffset, scroll);
            this.moved = false;
            if (this.lastOffset < 30) {
              console.log('a');
              if (scroll > offsets.a * 0.15) {
                console.log('going to 1');
                this.goToIndex(1);
              } else {
                console.log('going to 0');
                this.goToIndex(0);
              }
              return;
            }

            if (
              this.lastOffset > offsets.a - 30 &&
              this.lastOffset < offsets.a + 30
            ) {
              console.log('b');
              if (scroll < offsets.a * 0.8) {
                this.goToIndex(0);
              } else if (scroll > offsets.b * 0.6) {
                console.log('going to 2');
                this.goToIndex(2);
              } else {
                this.goToIndex(1);
              }
              return;
            }

            if (
              this.lastOffset > offsets.b - 30 &&
              this.lastOffset < offsets.b + 30
            ) {
              if (
                scroll < offsets.b - (offsets.b - offsets.a) * 0.2 ||
                this.scrollOffset < offsets.b - (offsets.b - offsets.a) * 0.5
              ) {
                this.goToIndex(1);
              } else {
                this.goToIndex(2);
              }
            }
          }}
          bouncesZoom={false}
          initialNumToRender={100}
          alwaysBounceHorizontal={false}
          scrollToOverflowEnabled={false}
          scrollsToTop={false}
          scrollEventThrottle={1}
          directionalLockEnabled
          overScrollMode="never"
          maxToRenderPerBatch={100}
          removeClippedSubviews={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          
          contentOffset={{
            x: this.props.offsets.a,
            y: 0,
          }}
          data={['drawer', 'navigation', 'editor']}
          renderItem={this.renderItem}
        />
      </View>
    );
  }
}

CustomTabs.defaultProps = {
  onDrawerStateChange: () => {},
};
