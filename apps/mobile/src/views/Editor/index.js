import React, {useEffect, useState, createRef} from 'react';
import {
  View,
  SafeAreaView,
  Keyboard,
  LayoutAnimation,
  Platform,
  Linking,
  DeviceEventEmitter,
  KeyboardAvoidingView,
  Dimensions,
  TextInput,
  BackHandler,
} from 'react-native';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
  onThemeUpdate,
  clearThemeUpdateListener,
} from '../../common/common';
import WebView from 'react-native-webview';
import Icon from 'react-native-vector-icons/Feather';
import {useForceUpdate} from '../ListsEditor';
import {NavigationEvents} from 'react-navigation';
import {storage} from '../../../App';
import {SideMenuEvent} from '../../utils/utils';
import {Dialog} from '../../components/Dialog';
import {TouchableOpacity} from 'react-native-gesture-handler';
import * as Animatable from 'react-native-animatable';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import SideMenu from 'react-native-side-menu';
import {EditorMenu} from '../../components/EditorMenu';
import {AnimatedSafeAreaView} from '../Home';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

var timestamp = null;
var content = null;
var title = null;
let titleRef;
let EditorWebView;
let animatedViewRef;
const AnimatedTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);
const AnimatedTextInput = Animatable.createAnimatableComponent(TextInput);

const Editor = ({navigation}) => {
  // STATE

  const [colors, setColors] = useState(COLOR_SCHEME);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [resize, setResize] = useState(false);
  const [sidebar, setSidebar] = useState('30%');
  const [isOpen, setOpen] = useState(false);

  // VARIABLES

  let updateInterval = null;
  let keyboardDidShowListener = null;
  let keyboardDidHideListener = null;
  let setMenuRef;
  const forceUpdate = useForceUpdate();

  // FUNCTIONS

  const _keyboardDidShow = e => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setKeyboardHeight(e.endCoordinates.height);
  };

  const post = value => EditorWebView.postMessage(value);

  const _keyboardDidHide = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setKeyboardHeight(0);
  };

  async function onChange(data) {
    if (data !== '') {
      content = JSON.parse(data);
    }
  }

  const saveNote = async () => {
    console.log(await storage.getNotes());
    if (title || content) {
      timestamp = await storage.addNote({
        title,
        content,
        dateCreated: timestamp,
      });
    }
  };

  const onWebViewLoad = () => {
    post(JSON.stringify(colors));
    if (navigation.state.params && navigation.state.params.note) {
      let note = navigation.state.params.note;
      titleRef.setNativeProps({
        text: note.title,
      });
      title = note.title;
      timestamp = note.dateCreated;
      post(JSON.stringify(note.content.delta));
    }
    if (content && content.delta) {
      post(JSON.stringify(content.delta));
    }
  };
  const onTitleTextChange = value => {
    title = value;
    if (title.length > 12) {
      setResize(true);
    } else if (title.length < 12) {
      setResize(false);
    }
  };

  const _renderEditor = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{height: '100%'}}>
        <View
          style={{
            height: '100%',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '96%',
              alignSelf: 'center',
              marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.04,
            }}>
            <AnimatedTouchableOpacity
              onPress={() => {
                setDialog(true);
              }}
              transition={['width', 'height']}
              duration={250}
              style={{
                width: resize ? 35 : 40,
                height: resize ? 35 : 40,
              }}>
              <Icon
                style={{
                  paddingRight: 10,
                  marginTop: 3.5,
                }}
                name="chevron-left"
                color={colors.icon}
                size={resize ? SIZE.xl : SIZE.xxl}
              />
            </AnimatedTouchableOpacity>

            <AnimatedTextInput
              transition="fontSize"
              placeholder="Untitled Note"
              ref={ref => (titleRef = ref)}
              placeholderTextColor={colors.icon}
              style={{
                width: '80%',
                fontFamily: WEIGHT.bold,
                fontSize: resize ? SIZE.xl : SIZE.xxl,
                color: colors.pri,
                maxWidth: '90%',
                paddingVertical: 0,
              }}
              onChangeText={onTitleTextChange}
              onSubmitEditing={saveNote}
            />

            <AnimatedTouchableOpacity
              transition={['width', 'height']}
              duration={250}
              onPress={() => {
                setOpen(true);
              }}
              style={{
                width: resize ? 35 : 40,
                height: resize ? 35 : 40,
                justifyContent: 'center',

                alignItems: 'center',
                paddingTop: 3,
              }}>
              <Icon
                name="menu"
                color="white"
                size={resize ? SIZE.xl : SIZE.xxl}
              />
            </AnimatedTouchableOpacity>
          </View>

          <WebView
            ref={ref => (EditorWebView = ref)}
            onError={error => console.log(error)}
            onLoad={onWebViewLoad}
            javaScriptEnabled
            onShouldStartLoadWithRequest={request => {
              if (request.url.includes('https')) {
                Linking.openURL(request.url);
                return false;
              } else {
                return true;
              }
            }}
            renderLoading={() => (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'transparent',
                }}
              />
            )}
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            domStorageEnabled
            scrollEnabled={false}
            bounces={true}
            scalesPageToFit={true}
            source={
              Platform.OS === 'ios'
                ? require('./web/texteditor.html')
                : {
                    uri: 'file:///android_asset/texteditor.html',
                    baseUrl: 'baseUrl:"file:///android_asset/',
                  }
            }
            style={{
              height: '100%',
              maxHeight: '100%',
              backgroundColor: 'transparent',
            }}
            onMessage={evt => {
              if (evt.nativeEvent.data !== '') {
                onChange(evt.nativeEvent.data);
              }
            }}
          />
        </View>
      </KeyboardAvoidingView>
    );
  };

  // EFFECTS
  useEffect(() => {
    (timestamp = null), (content = null);
    title = null;
  }, []);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', () => {
      setDialog(true);
      return true;
    });
  });

  useEffect(() => {
    keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      _keyboardDidShow,
    );
    keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      _keyboardDidHide,
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    updateInterval = setInterval(async function() {
      await saveNote();
    }, 2000);
    return () => {
      saveNote();
      clearInterval(updateInterval);
      updateInterval = null;
    };
  }, []);

  useEffect(() => {
    DeviceEventEmitter.emit('hide');

    return () => {
      DeviceEventEmitter.emit('show');
    };
  }, []);

  useEffect(() => {
    SideMenuEvent.close();
    SideMenuEvent.disable();
    return () => {
      SideMenuEvent.open();
      SideMenuEvent.enable();
    };
  }, []);

  useEffect(() => {
    onThemeUpdate(() => {
      shouldFade = true;
      forceUpdate();
    });
    return () => {
      clearThemeUpdateListener(() => {
        forceUpdate();
      });
    };
  }, []);

  useEffect(() => {
    EditorWebView.reload();
  }, [colors.bg]);

  return (
    <SideMenu
      isOpen={isOpen}
      bounceBackOnOverdraw={false}
      contentContainerStyle={{
        opacity: 0,
      }}
      openMenuOffset={w / 1.2}
      menuPosition="right"
      onChange={args => {
        setOpen(args);
      }}
      menu={
        <EditorMenu
          hide={false}
          close={() => {
            setOpen(false);
          }}
        />
      }>
      <AnimatedSafeAreaView
        transition="backgroundColor"
        duration={1000}
        style={{height: '100%', backgroundColor: colors.bg}}>
        <Dialog
          title="Close Editor"
          visible={dialog}
          icon="x"
          paragraph="Are you sure you want to close editor?"
          close={() => {
            setDialog(false);
          }}
          positivePress={() => {
            navigation.goBack();
            setDialog(false);
          }}
        />
        {_renderEditor()}
      </AnimatedSafeAreaView>
    </SideMenu>
  );
};

Editor.navigationOptions = {
  header: null,
  headerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 0,
  },
};

export default Editor;
