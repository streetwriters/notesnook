import {
  activateKeepAwake,
  deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';
import React, {Component, createRef, useEffect, useRef, useState} from 'react';
import {Dimensions, FlatList, Keyboard, TextInput, View} from 'react-native';
import Animated, {useValue} from 'react-native-reanimated';
import {notesnook} from './e2e/test.ids';
import ContextMenu from './src/components/ContextMenu';
import {DialogManager} from './src/components/DialogManager';
import {DummyText} from './src/components/DummyText';
import {Menu} from './src/components/Menu';
import {Toast} from './src/components/Toast';
import {NavigatorStack} from './src/navigation/NavigatorStack';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import {dHeight, editing, setWidthHeight} from './src/utils';
import {updateStatusBarColor} from './src/utils/Colors';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eCloseSideMenu,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenSideMenu,
} from './src/utils/Events';
import {editorRef, tabBarRef} from './src/utils/Refs';
import {sleep} from './src/utils/TimeUtils';
import {EditorWrapper} from './src/views/Editor/EditorWrapper';
import {EditorWebView, getNote} from './src/views/Editor/Functions';
import tiny from './src/views/Editor/tiny/tiny';
let {width, height} = Dimensions.get('window');
let layoutTimer = null;
let currentTab = 0;

const onChangeTab = async obj => {
  console.log(obj.i);
  if (obj.i === 1) {
    console.log('making note');
    eSendEvent(eCloseSideMenu);
    editing.movedAway = false;
    currentTab = 1;
    activateKeepAwake();
    eSendEvent('navigate');
    eSendEvent(eClearEditor, 'addHandler');
    console.log(editing.currentlyEditing, getNote(), editing.isRestoringState);
    if (
      !editing.isRestoringState &&
      (!editing.currentlyEditing || !getNote())
    ) {
      console.log('new note');
      eSendEvent(eOnLoadNote, {type: 'new'});
      editing.currentlyEditing = true;
    }
    sleep(1000).then(() => {
      updateStatusBarColor();
    });
  } else {
    if (obj.from === 1) {
      updateStatusBarColor();
      deactivateKeepAwake();
      eSendEvent(eClearEditor, 'removeHandler');
      if (getNote()?.locked) {
        eSendEvent(eClearEditor);
      }
      eSendEvent('showTooltip');
      editing.movedAway = true;
      tiny.call(EditorWebView, tiny.blur);
    }
    editing.isFocused = false;
    currentTab = 0;
    eSendEvent(eOpenSideMenu);
  }
};

export const RootView = React.memo(
  () => {
    return (
      <>
        <AppStack />
        <Toast />
        <ContextMenu />
        <DummyText />
        <DialogManager />
      </>
    );
  },
  () => true,
);

let updatedDimensions = {
  width: width,
  height: height,
};

let currentScroll = 0;
let startLocation = 0;
let startLocationX = 0;
const _responder = e => {
  startLocation = e.nativeEvent.pageY;
  startLocationX = e.nativeEvent.pageX;
  _handleTouch();
  return false;
};
const _moveResponder = e => {
  _handleTouch();
  return false;
};

let touchEndTimer = null;

const _handleTouch = () => {
  {
    let heightCheck = !editing.tooltip
      ? updatedDimensions.height - 70
      : updatedDimensions.height - 140;
    if (
      (currentTab === 1 && startLocation > heightCheck) ||
      (currentTab === 1 && startLocationX > 50) ||
      (currentTab === 0 && startLocationX < 150)
    ) {
      if (currentScroll === 0 || currentScroll === 1) {
        tabBarRef.current?.setScrollEnabled(false);
      }
    } else {
      tabBarRef.current?.setScrollEnabled(true);
    }
  }
};

const _onTouchEnd = e => {
  startLocation = 0;
  clearTimeout(touchEndTimer);
  touchEndTimer = null;
  touchEndTimer = setTimeout(() => {
    tabBarRef.current?.setScrollEnabled(true);
  }, 200);
};

const AppStack = React.memo(
  () => {
    const [state, dispatch] = useTracked();
    const {colors, deviceMode} = state;
    const [dimensions, setDimensions] = useState({width, height});
    const animatedOpacity = useValue(0);
    const animatedHeight = useValue(0);
    const overlayRef = useRef();
    const showFullScreenEditor = () => {
      dispatch({type: Actions.FULLSCREEN, state: true});
      editorRef.current?.setNativeProps({
        style: {
          position: 'absolute',
          width: dimensions.width,
          zIndex: 999,
          paddingHorizontal: dimensions.width * 0.15,
          backgroundColor: colors.bg,
        },
      });
    };

    const closeFullScreenEditor = () => {
      dispatch({type: Actions.FULLSCREEN, state: false});
      editorRef.current?.setNativeProps({
        style: {
          position: 'relative',
          width: dimensions.width * 0.55,
          zIndex: null,
          paddingHorizontal: 0,
        },
      });
    };

    useEffect(() => {
      toggleView(false);
      eSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
      eSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

      return () => {
        eUnSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
        eUnSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);
      };
    }, []);

    const _onLayout = async event => {
      if (layoutTimer) {
        clearTimeout(layoutTimer);
        layoutTimer = null;
      }

      let size = event?.nativeEvent?.layout;
      updatedDimensions = size;
      if (!size || (size.width === dimensions.width && deviceMode !== null)) {
        DDS.setSize(size);
        //console.log(deviceMode, 'MODE__');
        dispatch({type: Actions.DEVICE_MODE, state: deviceMode});
        return;
      }

      layoutTimer = setTimeout(async () => {
        checkDeviceType(size);
      }, 500);
    };

    function checkDeviceType(size) {
      setDimensions({
        width: size.width,
        height: size.height,
      });

      setWidthHeight(size);
      DDS.setSize(size);
      //console.log(DDS.isLargeTablet(), size, DDS.isSmallTab);
      if (DDS.isLargeTablet()) {
        //console.log('setting large tab');
        setDeviceMode('tablet', size);
        tabBarRef.current?.goToIndex(0)
        sleep(300).then(r => eSendEvent(eOpenSideMenu));
      } else if (DDS.isSmallTab) {
        //console.log('setting small tab');
        setDeviceMode('smallTablet', size);
        tabBarRef.current?.goToIndex(0)
        sleep(300).then(r => eSendEvent(eOpenSideMenu));
      } else {
        setDeviceMode('mobile', size);
        tabBarRef.current?.goToIndex(1)
        sleep(300).then(r => eSendEvent(eOpenSideMenu));
      }
    }

    function setDeviceMode(current, size) {
      eSendEvent(current !== 'mobile' ? eCloseSideMenu : eOpenSideMenu);
      dispatch({type: Actions.DEVICE_MODE, state: current});
      dispatch({type: Actions.FULLSCREEN, state: false});

      editorRef.current?.setNativeProps({
        style: {
          position: 'relative',
          width: current === 'tablet' ? size.width * 0.55 : size.width,
          zIndex: null,
          paddingHorizontal: 0,
        },
      });
      if (!editing.movedAway && current !== 'tablet') {
        tabBarRef.current?.goToPage(1);
      }
    }

    const onScroll = scrollOffset => {
      if (scrollOffset > 299) {
        animatedOpacity.setValue(0);
        toggleView(false);
      } else {
        let o = scrollOffset / 300;
        let op = 0;
        if (o < 0) {
          op = 1;
        } else {
          op = 1 - o;
        }
        animatedOpacity.setValue(op);
        toggleView(true);
      }
    };

    const toggleView = show => {
      overlayRef.current?.setNativeProps({
        style: {
          display: show ? 'flex' : 'none',
          zIndex: show ? 999 : -10,
        },
      });
    };

    return (
      <View
        onLayout={_onLayout}
        testID={notesnook.ids.default.root}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
        }}>
        {deviceMode && (
          <CustomTabs
            ref={tabBarRef}
            style={{
              zIndex: 1,
            }}
            onDrawerStateChange={state => {
              //console.log(state);
            }}
            initialIndex={deviceMode === 'smallTablet' ? 0 : 1}
            offsets={{
              a: deviceMode === 'smallTablet' ? dimensions.width : 300,
              b:
                deviceMode === 'smallTablet'
                  ? dimensions.width
                  : dimensions.width + 300,
              c:
                deviceMode === 'smallTablet'
                  ? dimensions.width * 2
                  : dimensions.width * 2 + 300,
            }}
            items={[
              <View
                style={{
                  height: '100%',
                  width:
                    deviceMode === 'smallTablet'
                      ? dimensions.width * 0.35
                      : 300,
                }}>
                <Menu />
              </View>,
              <View
                style={{
                  height: '100%',
                  width:
                    deviceMode === 'mobile'
                      ? dimensions.width
                      : dimensions.width * 0.65,
                }}>
                {deviceMode === 'mobile' && (
                  <View
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      display: 'none',
                      zIndex: -10,
                    }}
                    ref={overlayRef}>
                    <Animated.View
                      onTouchEnd={() => {
                        tabBarRef.current?.goToIndex(1)
                      }}
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        opacity: animatedOpacity,
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </View>
                )}

                <NavigatorStack />
              </View>,
              <EditorWrapper dimensions={dimensions} />,
            ]}
            onScroll={onScroll}
            onChangeTab={onChangeTab}
          />
        )}

        {/*  {deviceMode !== 'tablet' && (
              <View
                style={{
                  width: dimensions.width,
                  height: '100%',
                  borderRightColor: colors.nav,
                  borderRightWidth: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                {deviceMode === 'smallTablet' && (
                  <View
                    style={{
                      height: '100%',
                      width: dimensions.width * 0.35,
                    }}>
                    <Menu />
                  </View>
                )}

                <View
                  style={{
                    height: '100%',
                    width:
                      deviceMode === 'mobile'
                        ? dimensions.width
                        : dimensions.width * 0.65,
                  }}>
                  <NavigatorStack />
                </View>
              </View>
            )}

            <View
              style={{
                width: '100%',
                height: '100%',
                flexDirection: 'row',
                backgroundColor: colors.bg,
              }}>
              {deviceMode === 'tablet' && (
                <View
                  style={{
                    width: dimensions.width * 0.45,
                    height: '100%',
                    borderRightColor: colors.nav,
                    borderRightWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <View
                    style={{
                      height: '100%',
                      width: dimensions.width * 0.15,
                    }}>
                    <Menu />
                  </View>

                  <View
                    style={{
                      height: '100%',
                      width: dimensions.width * 0.3,
                    }}>
                    <NavigatorStack />
                  </View>
                </View>
              )}
              <EditorWrapper dimensions={dimensions} />
            </View> */}
      </View>
    );
  },
  () => true,
);

class CustomTabs extends Component {
  constructor(props) {
    super(props);
    this.listRef = createRef();
    this.scrollOffset = props.initialIndex === 0 ? 0 : 300;
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
    // console.log(this.responderAllowedScroll,'allowed scrolling')
    if (this.responderAllowedScroll) return;
    let x = event.nativeEvent.pageX;
    let y = event.nativeEvent.pageY;
    this.hideKeyboardIfVisible();
    let cOffset = this.scrollOffset.toFixed(0);
    let pOffset = this.props.offsets.b.toFixed(0);
    let heightCheck = !editing.tooltip
      ? updatedDimensions.height - 70
      : updatedDimensions.height - 140;

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
    console.log('open');
    if (this.page === 0) {
      this.goToIndex(0);
    }
  };

  closeDrawer = () => {
    console.log('close');
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
    // console.log('called me', index);
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
    //console.log('touch has ended');
    this.responderAllowedScroll = false;
    this.listRef.current?.getNativeScrollRef().setNativeProps({
      scrollEnabled: true,
    });
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
    //console.log('scroll end');
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
      console.log(page);
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
