import React, {useEffect, useState} from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import {normalize} from '../../common/common';
import {ActionIcon} from '../../components/ActionIcon';
import {
  ActionSheetEvent,
  simpleDialogEvent,
} from '../../components/DialogManager/recievers';
import {
  TEMPLATE_EXIT_FULLSCREEN,
  TEMPLATE_NEW_NOTE,
} from '../../components/DialogManager/templates';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
} from '../../services/events';
import {exitEditorAnimation} from '../../utils/animations';
import {DDS, editing, ToastEvent} from '../../utils/utils';
import {
  checkNote,
  clearEditor,
  EditorWebView,
  getNote,
  injectedJS,
  loadNote,
  onWebViewLoad,
  post,
  sourceUri,
  _onMessage,
  _onShouldStartLoadWithRequest,
} from './func';

var handleBack;
var tapCount = 0;
const Editor = ({noMenu}) => {
  // Global State
  const [state, dispatch] = useTracked();
  const {colors, premium} = state;
  const [fullscreen, setFullscreen] = useState(false);

  // FUNCTIONS

  useEffect(() => {
    let c = {...colors};
    c.factor = normalize(1);
    post('theme', colors);
  }, [colors.bg]);

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote, load);
    eSubscribeEvent(eCloseFullscreenEditor, closeFullscreen);
    eSubscribeEvent(eClearEditor, onCallClear);
    return () => {
      eUnSubscribeEvent(eClearEditor, onCallClear);
      eUnSubscribeEvent(eCloseFullscreenEditor, closeFullscreen);
      eUnSubscribeEvent(eOnLoadNote, load);
    };
  }, []);

  useEffect(() => {
    if (!noMenu && DDS.isTab) {
      handleBack = BackHandler.addEventListener('hardwareBackPress', () => {
        simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN());
        editing.isFullscreen = false;
        return true;
      });
    }

    return () => {
      if (handleBack) {
        handleBack.remove();
        handleBack = null;
      }
    };
  }, [noMenu]);

  const load = (item) => {
    loadNote(item);
    if (!DDS.isTab) {
      handleBack = BackHandler.addEventListener(
        'hardwareBackPress',
        _onHardwareBackPress,
      );
    }
  };

  const onCallClear = () => {
    canSave = false;
    if (editing.currentlyEditing) {
      exitEditorAnimation();
    }
    clearEditor();
  };
  const closeFullscreen = () => {
    setFullscreen(false);
  };

  useEffect(() => {
    EditorWebView.current?.reload();
  }, [premium]);

  const _onHardwareBackPress = async () => {
    if (editing.currentlyEditing) {
      if (tapCount > 0) {
        _onBackPress();
        return true;
      } else {
        tapCount = 1;
        setTimeout(() => {
          tapCount = 0;
        }, 3000);
        ToastEvent.show('Press back again to exit editor', 'success');
        return true;
      }
    }
  };

  const _onBackPress = async () => {
    editing.currentlyEditing = true;
    if (DDS.isTab) {
      simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN());
    } else {
      exitEditorAnimation();
      if (checkNote()) {
        ToastEvent.show('Note Saved!', 'success');
      }
      setTimeout(async () => {
        await clearEditor();
      }, 300);
      if (handleBack) {
        handleBack.remove();
        handleBack = null;
      }
    }
  };

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
            flexDirection: 'row',
            width: '100%',
            height: 50,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          {noMenu ? null : (
            <ActionIcon
              name="arrow-left"
              color={colors.heading}
              onPress={_onBackPress}
              customStyle={{
                marginLeft: -5,
                paddingLeft: 12,
              }}
            />
          )}

          <View
            style={{
              flexDirection: 'row',
            }}>
            <ActionIcon
              name="plus"
              color={colors.heading}
              onPress={() => {
                simpleDialogEvent(TEMPLATE_NEW_NOTE);
              }}
            />
            {DDS.isTab && !fullscreen ? (
              <ActionIcon
                name="fullscreen"
                color={colors.heading}
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
              />
            ) : null}

            <ActionIcon
              name="undo-variant"
              color={colors.heading}
              onPress={() => {
                post('undo');
              }}
            />
            <ActionIcon
              name="redo-variant"
              color={colors.heading}
              onPress={() => {
                post('redo');
              }}
            />

            <ActionIcon
              name="dots-horizontal"
              color={colors.heading}
              onPress={() => {
                ActionSheetEvent(
                  getNote(),
                  true,
                  true,
                  ['Add to', 'Share', 'Export', 'Delete'],
                  ['Dark Mode', 'Add to Vault', 'Pin', 'Favorite'],
                );
              }}
            />
          </View>
        </View>

        <WebView
          ref={EditorWebView}
          onError={(error) => console.log(error)}
          onLoad={() => onWebViewLoad(noMenu, premium, colors)}
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
          cacheEnabled={false}
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
            width: '100%',
            backgroundColor: 'transparent',
          }}
          onMessage={_onMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Editor;
