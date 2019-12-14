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
  TouchableOpacity,
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
import {db} from '../../../App';
import {SideMenuEvent} from '../../utils/utils';
import {Dialog} from '../../components/Dialog';
import {DDS} from '../../../App';
import * as Animatable from 'react-native-animatable';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import SideMenu from 'react-native-side-menu';
import {EditorMenu} from '../../components/EditorMenu';
import {AnimatedSafeAreaView} from '../Home';
import {useAppContext} from '../../provider/useAppContext';
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
  const [dialog, setDialog] = useState(false);
  const [resize, setResize] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [hide, setHide] = useState(true);
  const [sidebar, setSidebar] = useState(DDS.isTab ? true : false);
  // VARIABLES

  let updateInterval = null;
  let keyboardDidShowListener = null;
  let keyboardDidHideListener = null;
  let setMenuRef;
  const forceUpdate = useForceUpdate();
  const {userLoggedIn, logInUser} = useAppContext();
  // FUNCTIONS

  const _keyboardDidShow = e => {
    if (!isOpen) {
      setTimeout(() => {
        setHide(true);
      }, 300);
    }
  };

  const post = value => EditorWebView.postMessage(value);

  const _keyboardDidHide = () => {
    setTimeout(() => {
      setHide(false);
    }, 10000);
  };

  const onChange = data => {
    if (data !== '') {
      content = JSON.parse(data);
    }
  };

  const saveNote = async () => {
    if (!content) {
      content = {
        text: '',
        delta: null,
      };
    }

    timestamp = await db.addNote({
      title,
      content,
      dateCreated: timestamp,
    });
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

    EditorWebView.requestFocus();
    setTimeout(() => {
      post(null);
    }, 500);
  };
  const onTitleTextChange = value => {
    title = value;
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
            <TouchableOpacity
              onPress={() => {
                setDialog(true);
              }}
              style={{
                width: 40,
                height: 40,
              }}>
              <Icon
                style={{
                  paddingRight: 10,
                  marginTop: 3.5,
                }}
                name="chevron-left"
                color={colors.icon}
                size={SIZE.xl}
              />
            </TouchableOpacity>

            <TextInput
              placeholder="Untitled Note"
              ref={ref => (titleRef = ref)}
              placeholderTextColor={colors.icon}
              defaultValue={title}
              style={{
                width: '80%',
                fontFamily: WEIGHT.bold,
                fontSize: SIZE.xl,
                color: colors.pri,
                maxWidth: '80%',
                paddingVertical: 0,
              }}
              onChangeText={onTitleTextChange}
              onSubmitEditing={saveNote}
            />

            <TouchableOpacity
              onPress={() => {
                DDS.isTab ? setSidebar(!sidebar) : setOpen(!isOpen);
              }}
              style={{
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 3,
              }}>
              <Icon
                name={sidebar || isOpen ? 'x' : 'menu'}
                color={colors.icon}
                size={SIZE.xl}
              />
            </TouchableOpacity>
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

  handleBackEvent = () => {
    setDialog(true);
    return true;
  };

  // EFFECTS

  useEffect(() => {
    console.log(userLoggedIn);
    let handleBack = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackEvent,
    );
    return () => {
      title = null;
      timestamp = null;
      content = null;

      handleBack.remove();
      handleBack = null;
    };
  }, []);

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
      DDS.isTab ? SideMenuEvent.open() : null;

      SideMenuEvent.enable();
    };
  });

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

  useEffect(() => {
    setTimeout(() => {
      setHide(false);
    }, 1000);
  }, []);

  return DDS.isTab ? (
    <View
      style={{
        flexDirection: 'row',
        width: '100%',
      }}>
      <AnimatedSafeAreaView
        transition={['backgroundColor', 'width']}
        duration={300}
        style={{
          height: '100%',
          backgroundColor: colors.bg,
          width: sidebar ? '70%' : '100%',
        }}>
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
      <Animatable.View
        transition={['width', 'opacity']}
        duration={300}
        style={{
          width: sidebar ? '30%' : '0%',
          opacity: sidebar ? 1 : 0,
        }}>
        <EditorMenu />
      </Animatable.View>
    </View>
  ) : (
    <SideMenu
      isOpen={isOpen}
      bounceBackOnOverdraw={false}
      contentContainerStyle={{
        opacity: 0,
      }}
      openMenuOffset={w / 1.2}
      menuPosition="right"
      onChange={args => {
        setTimeout(() => {
          setOpen(args);
        }, 300);
      }}
      menu={
        <EditorMenu
          hide={hide}
          close={() => {
            setOpen(false);
          }}
        />
      }>
      <AnimatedSafeAreaView
        transition="backgroundColor"
        duration={300}
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
