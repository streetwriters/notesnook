import {
  activateKeepAwake,
  deactivateKeepAwake,
} from '@sayem314/react-native-keep-awake';
import React, {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Component} from 'react';
import {FlatList} from 'react-native';
import {Dimensions, View} from 'react-native';
import Animated, {useValue} from 'react-native-reanimated';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import {notesnook} from './e2e/test.ids';
import ContextMenu from './src/components/ContextMenu';
import {DialogManager} from './src/components/DialogManager';
import {DummyText} from './src/components/DummyText';
import {Menu} from './src/components/Menu';
import Splash from './src/components/SplashScreen';
import {Toast} from './src/components/Toast';
import {NavigationStack} from './src/navigation/Drawer';
import {NavigatorStack} from './src/navigation/NavigatorStack';
import {useTracked} from './src/provider';
import {Actions} from './src/provider/Actions';
import {DDS} from './src/services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import {editing, setWidthHeight} from './src/utils';
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
  if (obj.i === 1) {
    eSendEvent(eCloseSideMenu);
    editing.movedAway = false;
    currentTab = 1;
    activateKeepAwake();
    eSendEvent('navigate');
    eSendEvent(eClearEditor, 'addHandler');
    if (
      !editing.isRestoringState &&
      (!editing.currentlyEditing || !getNote())
    ) {
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
    const animatedZIndex = useValue(-10);

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
        sleep(300).then(r => eSendEvent(eOpenSideMenu));
      } else if (DDS.isSmallTab) {
        //console.log('setting small tab');
        setDeviceMode('smallTablet', size);
        sleep(300).then(r => eSendEvent(eOpenSideMenu));
      } else {
        setDeviceMode('mobile', size);
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

    const onScroll = scroll => {
      currentScroll = scroll;
      if (scroll === 0) {
        eSendEvent(eOpenSideMenu);
      } else {
        eSendEvent(eCloseSideMenu);
      }
    };

    const renderTabBar = useCallback(() => <></>, []);

    const toggleView = show => {
      //animatedZIndex.setValue(show? 999 : -10)
    };

    return (
      <View
        onLayout={_onLayout}
        testID={notesnook.ids.default.root}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
        }}
        //onMoveShouldSetResponderCapture={_moveResponder}
        // onTouchEnd={_onTouchEnd}
        //onStartShouldSetResponderCapture={_responder}
      >
        {deviceMode && (
          <CustomTabs
            ref={tabBarRef}
            style={{
              zIndex: 1,
            }}
            onDrawerStateChange={state => {
              console.log(state);
            }}
            offsets={{
              a: 300,
              b: dimensions.width + 300,
              c: dimensions.width * 2 + 300,
            }}
            items={[
              <View
                style={{
                  height: '100%',
                  width: 300,
                }}>
                <Menu />
              </View>,
              <View
                style={{
                  height: '100%',
                  width: dimensions.width,
                }}>
                <Animated.View
                  onTouchEnd={() => {
                    tabBarRef.current?.listRef?.current?.scrollToIndex({
                      animated: true,
                      index: 1,
                      viewOffset: 0,
                      viewPosition: 0,
                    });
                  }}
                  style={{
                    position: 'absolute',
                    width: dimensions.width,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    opacity: animatedOpacity,
                    height: '100%',
                    zIndex: -10,
                  }}
                />
                <NavigatorStack />
              </View>,
              <EditorWrapper dimensions={dimensions} />,
            ]}
            onScroll={scrollOffset => {
              if (scrollOffset > 300) {
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
                toggleView(true)
              }
            }}
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

let OFFSET_A = 300;
let OFFSET_B = 300 + Dimensions.get('window').width;
let OFFSET_C = 300 + Dimensions.get('window').width * 2;

class CustomTabs extends Component {
  constructor(props) {
    super(props);
    this.listRef = createRef();
    this.scrollOffset = 300;
    this.page = 0;
  }

  renderItem = ({item, index}) => this.props.items[index];

  onMoveShouldSetResponder = event => {
    let x = event.nativeEvent.locationX;
    let y = event.nativeEvent.locationY;

    if (this.scrollOffset.toFixed(0) === this.props.offsets.b.toFixed(0)) {
      if (x > 50 && y < Dimensions.get('window').height - 70) {
        this.listRef.current?.getNativeScrollRef().setNativeProps({
          scrollEnabled: false,
        });
        this.listRef.current?.scrollToIndex({
          animated: true,
          index: 2,
          viewOffset: 0,
          viewPosition: 0,
        });
      } else {
        this.listRef.current?.getNativeScrollRef().setNativeProps({
          scrollEnabled: true,
        });
      }
    }
  };

  openDrawer = () => {
    console.log('open');
    if (this.page === 0) {
      this.listRef.current?.scrollToIndex({
        animated: true,
        index: 0,
        viewOffset: 0,
        viewPosition: 0,
      });
    }
  };

  closeDrawer = () => {
    console.log('close');
    if (this.page === 0) {
      this.listRef.current?.scrollToIndex({
        animated: true,
        index: 1,
        viewOffset: 0,
        viewPosition: 0,
      });
    }
  };

  setScrollEnabled = () => {};

  onTouchEnd = () => {
    this.listRef.current?.getNativeScrollRef().setNativeProps({
      scrollEnabled: true,
    });
  };

  onScroll = event => {
    this.scrollOffset = event.nativeEvent.contentOffset.x;
    this.props.onScroll(this.scrollOffset);
  };

  goToPage = page => {
    if (page === 0) {
      this.listRef.current?.scrollToIndex({
        animated: true,
        index: 1,
        viewOffset: 0,
        viewPosition: 0,
      });
    } else if (page === 1) {
      this.listRef.current?.scrollToIndex({
        animated: true,
        index: 2,
        viewOffset: 0,
        viewPosition: 0,
      });
    }
  };

  keyExtractor = (item, index) => item;

  onScrollEnd = event => {
    this.page = 0;
    if (this.scrollOffset.toFixed(0) === this.props.offsets.b.toFixed(0)) {
      this.page = 1;
    }
    this.props.onDrawerStateChange(this.page === 0 && this.scrollOffset < 10);
    this.props.onChangeTab(this.page);
  };

  render() {
    return (
      <View
        onTouchEnd={this.onTouchEnd}
        onMoveShouldSetResponder={this.props.onMoveShouldSetResponder}
        style={{
          flex: 1,
        }}>
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
          overScrollMode="never"
          decelerationRate="fast"
          maxToRenderPerBatch={100}
          removeClippedSubviews={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          disableIntervalMomentum={true}
          snapToOffsets={[
            this.props.offsets.a,
            this.props.offsets.b,
            this.props.offsets.c,
          ]}
          initialScrollIndex={1}
          data={['drawer', 'navigation', 'editor']}
          renderItem={this.renderItem}
        />
      </View>
    );
  }
}
