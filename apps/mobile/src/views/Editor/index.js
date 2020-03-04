import React, {createRef, useEffect, useState} from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';
import {db, DDS} from '../../../App';
import {normalize, SIZE, WEIGHT} from '../../common/common';
import {
  ActionSheetEvent,
  simpleDialogEvent,
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
  refreshNotesPage,
} from '../../services/events';
import {exitEditorAnimation} from '../../utils/animations';
import {
  editing,
  SideMenuEvent,
  timeConverter,
  ToastEvent,
} from '../../utils/utils';
import {TabRouter} from 'react-navigation';

const EditorWebView = createRef();
let note = {};
let id = null;
var content = null;
var title = null;
let timer = null;
let saveCounter = 0;
let tapCount = 0;

const Editor = ({navigation, noMenu}) => {
  // Global State
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [fullscreen, setFullscreen] = useState(false);
  const [dateEdited, setDateEdited] = useState(0);
  // FUNCTIONS

  const post = value => EditorWebView.current?.postMessage(value);

  useEffect(() => {
    let c = {...colors};
    c.factor = normalize(1);
    post(JSON.stringify(c));
  }, [colors.bg]);

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote, loadNote);

    return () => {
      eUnSubscribeEvent(eOnLoadNote, loadNote);
    };
  }, []);

  const loadNote = async item => {
    noMenu ? null : SideMenuEvent.disable();
    if (note && note.id) {
      dispatch({type: ACTIONS.NOTES});
      if (item && item.type === 'new') {
        await clearEditor();
      } else {
        note = item;
        dispatch({
          type: ACTIONS.CURRENT_EDITING_NOTE,
          id: item.id,
        });
        updateEditor();
      }
    } else {
      dispatch({type: ACTIONS.NOTES});
      if (item && item.type === 'new') {
        await clearEditor();
      } else {
        note = item;
        dispatch({
          type: ACTIONS.CURRENT_EDITING_NOTE,
          id: item.id,
        });
        updateEditor();
      }
    }
  };

  const clearEditor = async () => {
    await saveNote(true);
    setDateEdited(0);
    title = null;
    content = null;
    note = null;
    id = null;
    tapCount = 0;
    saveCounter = 0;
    post('clear');
    post(JSON.stringify({type: 'text', value: ''}));
    post(
      JSON.stringify({
        type: 'title',
        value: '',
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
        delta: {ops: []},
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
    if (id !== rId && !note?.locked) {
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
    }

    if (id) {
      switch (editing.actionAfterFirstSave.type) {
        case 'topic': {
          await db.notes.move(
            {
              topic: editing.actionAfterFirstSave.id,
              id: editing.actionAfterFirstSave.notebook,
            },
            id,
          );
          editing.actionAfterFirstSave = {
            type: null,
          };

          break;
        }
        case 'tag': {
          await db.notes.note(note.id).tag(editing.actionAfterFirstSave.id);
          editing.actionAfterFirstSave = {
            type: null,
          };

          break;
        }
        case 'color': {
          console.log('I WORKED');

          await db.notes.note(id).color(editing.actionAfterFirstSave.id);

          editing.actionAfterFirstSave = {
            type: null,
          };

          break;
        }
        default: {
          break;
        }
      }

      dispatch({
        type: ACTIONS.CURRENT_EDITING_NOTE,
        id: id,
      });
    }

    if (content.text.length < 200 || saveCounter < 2) {
      dispatch({
        type: ACTIONS.NOTES,
      });
      eSendEvent(refreshNotesPage);
    }
    saveCounter++;
    if (id) {
      let lockednote = db.notes.note(id).data;

      if (lockNote && lockednote && lockednote.locked) {
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

    if (note && note.id) {
      updateEditor();
    } else {
      post('focusTitle');
    }
    let c = {...colors};
    c.factor = normalize(1);
    post(JSON.stringify(c));
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
    setDateEdited(note.dateEdited);
    content = note.content;
    if (!note.locked) {
      content.delta = await db.notes.note(id).delta();
    }

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
      let delta;
      if (typeof note.content.delta !== 'string') {
        delta = note.content.delta;
      } else {
        delta = await db.notes.note(id).delta();
      }

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

  const closeFullscreen = () => {
    setFullscreen(false);
  };

  // EFFECTS

  useEffect(() => {
    eSubscribeEvent(eCloseFullscreenEditor, closeFullscreen);

    return () => {
      eUnSubscribeEvent(eCloseFullscreenEditor, closeFullscreen);
    };
  });

  const _onHardwareBackPress = async () => {
    if (tapCount > 0) {
      exitEditorAnimation();
      if (note && note.id) {
        ToastEvent.show('Note Saved!', 'success');
      }
      Keyboard.dismiss();
      await clearEditor();
      if (noMenu) return true;
      DDS.isTab ? SideMenuEvent.open() : null;
      SideMenuEvent.enable();

      return true;
    } else {
      tapCount = 1;
      setTimeout(() => {
        tapCount = 0;
      }, 3000);
      ToastEvent.show('Press back again to exit editor', 'success');
      return true;
    }
  };

  useEffect(() => {
    let handleBack;
    if (!noMenu && DDS.isTab) {
      handleBack = BackHandler.addEventListener('hardwareBackPress', () => {
        simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN());
        editing.isFullscreen = false;
        return true;
      });
    } else if (!DDS.isTab) {
      handleBack = BackHandler.addEventListener(
        'hardwareBackPress',
        _onHardwareBackPress,
      );
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
      note = {};
    };
  }, [noMenu]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: DDS.isTab ? 'transparent' : colors.bg,
        height: '100%',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
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
            onPress={async () => {
              if (DDS.isTab) {
                simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN());
              } else {
                exitEditorAnimation();
                Keyboard.dismiss();
                if (note && note.id) {
                  ToastEvent.show('Note Saved!', 'success');
                }
                await clearEditor();
                DDS.isTab ? SideMenuEvent.open() : null;
                SideMenuEvent.enable();
              }
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
          {DDS.isTab && !fullscreen ? (
            <TouchableOpacity
              onPress={() => {
                eSendEvent(eOpenFullscreenEditor);
                setFullscreen(true);
                editing.isFullscreen = true;
                post(
                  JSON.stringify({
                    type: 'nomenu',
                    value: false,
                  }),
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
              <Icon name="fullscreen" color={colors.icon} size={SIZE.xxxl} />
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
            <Icon name="dots-horizontal" color={colors.icon} size={SIZE.xxxl} />
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
          ref={EditorWebView}
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
