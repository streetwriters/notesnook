import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import WebView from 'react-native-webview';
import {db, DDS} from '../../../App';
import {SIZE, WEIGHT} from '../../common/common';
import {
  ActionSheetEvent,
  simpleDialogEvent,
  TEMPLATE_EXIT,
  TEMPLATE_EXIT_FULLSCREEN,
  TEMPLATE_INFO,
} from '../../components/DialogManager';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
} from '../../services/events';
import {SideMenuEvent, timeConverter} from '../../utils/utils';
import {AnimatedSafeAreaView} from '../Home';

let EditorWebView;
let note = {};
let id = null;
let dateEdited = null;
var content = null;
var title = null;
let timer = null;
let saveCounter = 0;
const Editor = ({navigation, noMenu}) => {
  // Global State
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [loading, setLoading] = useState(true);

  let fullscreen = false;

  // FUNCTIONS

  const post = value => EditorWebView.postMessage(value);
  useEffect(() => {
    eSubscribeEvent(eOnLoadNote, loadNote);

    return () => {
      eUnSubscribeEvent(eOnLoadNote, loadNote);
    };
  }, []);

  const loadNote = item => {
    if (note && note.id) {
      saveNote(true).then(() => {
        dispatch({type: ACTIONS.NOTES});
        if (item && item.type === 'new') {
          clearEditor();
        } else {
          note = item;
          if (DDS.isTab) {
            dispatch({
              type: ACTIONS.CURRENT_EDITING_NOTE,
              id: item.id,
            });
          }

          updateEditor();
        }
      });
    } else {
      dispatch({type: ACTIONS.NOTES});
      if (item && item.type === 'new') {
        clearEditor();
      } else {
        note = item;
        if (DDS.isTab) {
          dispatch({
            type: ACTIONS.CURRENT_EDITING_NOTE,
            id: item.id,
          });
        }
        updateEditor();
      }
    }
  };

  const clearEditor = () => {
    id = null;
    title = null;
    content = null;
    note = {};
    saveCounter = 0;

    post('clear');
    post(
      JSON.stringify({
        type: 'title',
        value: null,
      }),
    );
    post('focusTitle');
  };

  const onChange = data => {
    if (data !== '') {
      let rawData = JSON.parse(data);
      if (rawData.type === 'content') {
        content = rawData;
      } else {
        title = rawData.value;
      }
    }
  };

  const _onMessage = evt => {
    if (evt.nativeEvent.data === 'loaded') {
      setLoading(false);
    } else if (
      evt.nativeEvent.data !== '' &&
      evt.nativeEvent.data !== 'loaded'
    ) {
      clearTimeout(timer);
      timer = null;
      onChange(evt.nativeEvent.data);
      timer = setTimeout(() => {
        saveNote.call(this, true);
      }, 1000);
    }
  };

  const _onShouldStartLoadWithRequest = request => {
    if (request.url.includes('https')) {
      Linking.openURL(request.url);
      return false;
    } else {
      return true;
    }
  };

  const saveNote = async (lockNote = true) => {
    if (!title && !content) return;
    if (title === '' && content.text === '') return;

    if (!content) {
      content = {
        text: '',
        delta: null,
      };
    }

    let rId = await db.notes.add({
      title,
      content: {
        text: content.text,
        delta: content.delta,
      },
      id: id,
    });

    if (id !== rId) {
      id = rId;
      note = db.notes.note(id);
      if (note) {
        note = note.data;
      } else {
        setTimeout(() => {
          note = db.notes.note(id);
          if (note) {
            note = note.data;
          }
        }, 500);
      }

      if (DDS.isTab) {
        dispatch({
          type: ACTIONS.CURRENT_EDITING_NOTE,
          id: id,
        });
      }
    }

    if (content.text.length < 200 || saveCounter < 2) {
      dispatch({
        type: ACTIONS.NOTES,
      });
    }
    saveCounter++;
    if (id) {
      let lockednote = db.notes.note(id);
      if (lockNote && lockednote.locked) {
        await db.notes.note(id).lock('password');
      }
    }
  };

  useEffect(() => {
    if (noMenu) {
      post(
        JSON.stringify({
          type: 'nomenu',
          value: true,
        }),
      );
    } else {
      post(
        JSON.stringify({
          type: 'nomenu',
          value: false,
        }),
      );
    }
  }, [noMenu]);

  const onWebViewLoad = () => {
    //EditorWebView.requestFocus();
    if (noMenu) {
      post(
        JSON.stringify({
          type: 'nomenu',
          value: true,
        }),
      );
    } else {
      post(
        JSON.stringify({
          type: 'nomenu',
          value: false,
        }),
      );
    }

    if (navigation && navigation.state.params && navigation.state.params.note) {
      note = navigation.state.params.note;
      updateEditor();
    } else if (note && note.id) {
      updateEditor();
    } else {
      post('focusTitle');
      wait(500).then(() => {
        setLoading(false);
      });
    }

    post(JSON.stringify(colors));
  };

  const wait = timeout =>
    new Promise((resolve, reject) => {
      if (!timeout || typeof timeout !== 'number') reject();
      setTimeout(() => {
        resolve();
      }, timeout);
    });

  const updateEditor = async () => {
    title = note.title;
    id = note.id;
    dateEdited = note.dateEdited;
    content = note.content;
    saveCounter = 0;

    if (title !== null || title === '') {
      post(
        JSON.stringify({
          type: 'title',
          value: note.title,
        }),
      );
    } else {
      post('focusTitle');
      post('clear');
    }
    if (note.content.text === '' && note.content.delta === null) {
      post('clear');
    } else if (note.content.delta) {
      let delta = await db.notes.note(id).delta();
      post(JSON.stringify(delta));
    } else {
      post(JSON.stringify({type: 'text', value: note.content.text}));
    }
  };

  const params = 'platform=' + Platform.OS;
  const sourceUri =
    (Platform.OS === 'android' ? 'file:///android_asset/' : '') +
    'Web.bundle/loader.html';
  const injectedJS = `if (!window.location.search) {
         var link = document.getElementById('progress-bar');
          link.href = './site/index.html?${params}';
          link.click();  
    }`;

  const _renderEditor = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{
          height: '100%',
          width: '100%',
        }}>
        <View
          style={{
            marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
          }}></View>

        {noMenu ? null : (
          <TouchableOpacity
            onPress={() => {
              DDS.isTab
                ? simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN())
                : simpleDialogEvent(TEMPLATE_EXIT('Editor'));
            }}
            style={{
              width: 60,
              height: 50,
              justifyContent: 'center',
              alignItems: 'flex-start',
              position: 'absolute',
              left: 0,
              top: 0,
              marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
              paddingLeft: 12,
              zIndex: 800,
            }}>
            <Icon
              style={{
                marginLeft: -7,
                marginTop: -1.5,
              }}
              name="chevron-left"
              color={colors.icon}
              size={SIZE.xxxl - 3}
            />
          </TouchableOpacity>
        )}

        <View
          style={{
            flexDirection: 'row',
            marginRight: 0,
            position: 'absolute',
            marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
            zIndex: 800,
            right: 0,
            top: 0,
          }}>
          {DDS.isTab ? (
            <TouchableOpacity
              onPress={() => {
                if (fullscreen) {
                  fullscreen = false;
                  eSendEvent(eCloseFullscreenEditor);
                  post(
                    JSON.stringify({
                      type: 'nomenu',
                      value: true,
                    }),
                  );
                } else {
                  eSendEvent(eOpenFullscreenEditor);
                  fullscreen = true;
                  post(
                    JSON.stringify({
                      type: 'nomenu',
                      value: false,
                    }),
                  );
                }
              }}
              style={{
                width: 60,
                height: 50,
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingRight: 12,
                zIndex: 800,
              }}>
              <Icon name="square" color={colors.icon} size={SIZE.xxxl} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              ActionSheetEvent(
                note,
                true,
                true,
                ['Add to', 'Share', 'Export', 'Delete'],
                ['Dark Mode', 'Add to Vault', 'Pin', 'Favorite'],
              );
            }}
            style={{
              width: 60,
              height: 50,
              justifyContent: 'center',
              alignItems: 'flex-end',
              paddingRight: 12,
              zIndex: 800,
            }}>
            <Icon name="more-horizontal" color={colors.icon} size={SIZE.xxxl} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            paddingHorizontal: 12,
            marginTop:
              Platform.OS === 'ios' ? 45 : StatusBar.currentHeight + 45,
            width: '100%',
            position: 'absolute',
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: noMenu ? 12 : 12 + 50,
            zIndex: 999,
          }}>
          <Text
            onPress={() => {
              simpleDialogEvent(TEMPLATE_INFO(note.dateCreated));
            }}
            style={{
              color: colors.icon,
              fontSize: SIZE.xxs,
              textAlignVertical: 'center',
              fontFamily: WEIGHT.regular,
            }}>
            {timeConverter(dateEdited)}
          </Text>
        </View>
        <WebView
          ref={ref => (EditorWebView = ref)}
          onError={error => console.log(error)}
          onLoad={onWebViewLoad}
          javaScriptEnabled={true}
          injectedJavaScript={Platform.OS === 'ios' ? injectedJS : null}
          onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
          renderLoading={() => (
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
              }}
            />
          )}
          cacheMode="LOAD_DEFAULT"
          cacheEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          bounces={false}
          allowFileAccess={true}
          scalesPageToFit={true}
          allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          originWhitelist={['*']}
          source={
            Platform.OS === 'ios'
              ? {uri: sourceUri}
              : {
                  uri: 'file:///android_asset/texteditor.html',
                  baseUrl: 'file:///android_asset/',
                }
          }
          style={{
            height: '100%',
            maxHeight: '100%',
            backgroundColor: 'transparent',
          }}
          onMessage={_onMessage}
        />
      </KeyboardAvoidingView>
    );
  };

  // EFFECTS

  useEffect(() => {
    let handleBack;
    if (!noMenu && DDS.isTab) {
      handleBack = BackHandler.addEventListener('hardwareBackPress', () => {
        simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN());
        return true;
      });
    } else if (noMenu && !DDS.isTab) {
      handleBack = BackHandler.addEventListener('hardwareBackPress', () => {
        simpleDialogEvent(TEMPLATE_EXIT());
        return true;
      });
    } else {
      if (handleBack) {
        handleBack.remove();
        handleBack = null;
      }
    }

    return () => {
      if (handleBack) {
        handleBack.remove();
        handleBack = null;
      }
      title = null;
      content = null;
      id = null;
      timer = null;
    };
  }, [noMenu]);

  useEffect(() => {
    noMenu ? null : SideMenuEvent.disable();

    return () => {
      if (noMenu) return;
      DDS.isTab ? SideMenuEvent.open() : null;
      SideMenuEvent.enable();
    };
  });

  useEffect(() => {
    EditorWebView.reload();
  }, [colors]);

  return (
    <Animatable.View
      animation="fadeIn"
      duration={500}
      delay={1000}
      useNativeDriver={true}
      style={{
        flex: 1,
        backgroundColor: 'transparent',
        height: '100%',
        width: '100%',
      }}>
      <AnimatedSafeAreaView
        transition={['backgroundColor', 'width']}
        duration={300}
        style={{
          flex: 1,
          backgroundColor: DDS.isTab ? 'transparent' : colors.bg,
          height: '100%',
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Animatable.View
          transition="opacity"
          useNativeDriver={true}
          duration={150}
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
            backgroundColor: colors.bg,
            opacity: loading ? 1 : 0,
            position: 'absolute',
          }}>
          <ActivityIndicator color={colors.accent} size={SIZE.xxxl} />

          <Text
            style={{
              color: colors.accent,
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.md,
              marginTop: 10,
            }}>
            Write with confidence.
          </Text>
        </Animatable.View>

        <Animatable.View
          transition={['opacity']}
          useNativeDriver={true}
          duration={3000}
          delay={300}
          style={{
            width: '100%',
            height: '100%',
            zIndex: 2,
            opacity: loading ? 0 : 1,
          }}>
          {_renderEditor()}
        </Animatable.View>
      </AnimatedSafeAreaView>
    </Animatable.View>
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
