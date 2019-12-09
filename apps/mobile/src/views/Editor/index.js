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
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

var timestamp = null;
var content = null;
var title = null;
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
  // VARIABLES

  let updateInterval = null;
  let keyboardDidShowListener = null;
  let keyboardDidHideListener = null;

  // REFS

  let EditorWebView = createRef();
  const _textRender = createRef();

  // FUNCTIONS

  const _keyboardDidShow = e => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setKeyboardHeight(e.endCoordinates.height);
  };

  const post = value => EditorWebView.current.postMessage(value);

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

  const _renderEditor = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{height: '100%', backgroundColor: colors.bg}}>
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
              placeholderTextColor={colors.icon}
              style={{
                width: '80%',
                fontFamily: WEIGHT.bold,
                fontSize: resize ? SIZE.xl : SIZE.xxl,
                color: colors.pri,
                maxWidth: '90%',
                paddingVertical: 0,
              }}
              onChangeText={value => {
                title = value;
                if (title.length > 12) {
                  setResize(true);
                } else if (title.length < 12) {
                  setResize(false);
                }
              }}
              onSubmitEditing={async () => await saveNote()}
            />

            <AnimatedTouchableOpacity
              transition={['width', 'height']}
              duration={250}
              style={{
                width: resize ? 35 : 40,
                height: resize ? 35 : 40,
              }}>
              <Icon
                style={{
                  paddingRight: 10,
                  marginTop: 5,
                }}
                name="more-vertical"
                color={colors.icon}
                size={resize ? SIZE.xl : SIZE.xxl}
              />
            </AnimatedTouchableOpacity>
          </View>

          <WebView
            ref={EditorWebView}
            onError={error => console.log(error)}
            onLoad={() => {
              post(JSON.stringify(colors));
              if (navigation.state.params && navigation.state.params.note) {
                let note = navigation.state.params.note;

                post(JSON.stringify(note.content.delta));
              }
            }}
            javaScriptEnabled
            onShouldStartLoadWithRequest={request => {
              if (request.url.includes('https')) {
                Linking.openURL(request.url);
                return false;
              } else {
                return true;
              }
            }}
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
              backgroundColor: colors.bg,
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
    if (navigation.state.params && navigation.state.params.note) {
      let note = navigation.state.params.note;
      titleRef.current.setNativeProps({
        text: note.title,
      });
      title = note.title;
      timestamp = note.dateCreated;
    }
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
      SideMenuEvent.open();
      SideMenuEvent.enable();
    };
  }, []);

  return (
    <SafeAreaView style={{height: '100%', backgroundColor: colors.bg}}>
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
    </SafeAreaView>
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
