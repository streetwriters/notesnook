import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import WebView from 'react-native-webview';
import { notesnook } from '../../../e2e/test.ids';
import { useEditorStore, useUserStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { getCurrentColors } from '../../utils/color-scheme';
import { eOnLoadNote } from '../../utils/events';
import { tabBarRef } from '../../utils/global-refs';
import { sleep } from '../../utils/time';
import EditorHeader from './EditorHeader';
import {
  disableEditing,
  EditorWebView,
  getNote,
  onWebViewLoad,
  sourceUri,
  _onMessage,
  _onShouldStartLoadWithRequest
} from './Functions';
import tiny from './tiny/tiny';
import EditorToolbar from './tiny/toolbar';

const source = { uri: sourceUri + 'index.html' };

const style = {
  height: '100%',
  maxHeight: '100%',
  width: '100%',
  alignSelf: 'center',
  backgroundColor: 'transparent'
};

const Editor = React.memo(
  () => {
    const premiumUser = useUserStore(state => state.premium);
    const sessionId = useEditorStore(state => state.sessionId);
    const [resetting, setResetting] = useState(false);
    const onLoad = async () => {
      await onWebViewLoad(premiumUser, getCurrentColors());
    };

    useEffect(() => {
      if (premiumUser) {
        tiny.call(EditorWebView, tiny.setMarkdown, true);
      }
    }, [premiumUser]);

    const onResetRequested = async preventSave => {
      if (!getNote()) {
        eSendEvent('loadingNote', null);
      }
      setResetting(true);
      await sleep(10);
      setResetting(false);
      if (!DDS.isTab && tabBarRef.current?.page === 0) {
        console.log('Editor out of bounds');
        return;
      }
      if (preventSave) {
        disableEditing();
      }

      if (getNote()) {
        eSendEvent(eOnLoadNote, { ...getNote(), forced: true });
      }
      console.log('resetting editor');
    };

    useEffect(() => {
      eSubscribeEvent('webviewreset', onResetRequested);
      return () => {
        eUnSubscribeEvent('webviewreset', onResetRequested);
      };
    }, []);

    return resetting ? null : (
      <>
        <View
          style={{
            flexGrow: 1,
            backgroundColor: 'transparent',
            flex: 1
          }}
        >
          <EditorHeader />
          <WebView
            testID={notesnook.editor.id}
            ref={EditorWebView}
            onLoad={onLoad}
            onRenderProcessGone={() => {
              onResetRequested();
            }}
            onError={() => {
              onResetRequested();
            }}
            injectedJavaScript={`
            sessionId="${sessionId}";
            console.log(sessionId);
            (function() {
              const func = function() {
                setTimeout(function() {
                  if (globalThis.tinymce) {
                    init_tiny("calc(100vh - 55px)");
                  } else {
                    console.log('tinymce is not ready');
                    func();
                  }
                },5);
              }
              func();
            })();`}
            javaScriptEnabled={true}
            focusable={true}
            keyboardDisplayRequiresUserAction={false}
            onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
            cacheMode="LOAD_DEFAULT"
            cacheEnabled={true}
            domStorageEnabled={true}
            bounces={false}
            allowFileAccess={true}
            scalesPageToFit={true}
            renderLoading={() => <View />}
            startInLoadingState
            hideKeyboardAccessoryView={true}
            allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={['*']}
            source={source}
            style={style}
            autoManageStatusBarEnabled={false}
            onMessage={_onMessage}
          />
        </View>
        <EditorToolbar />
      </>
    );
  },
  () => true
);

export default Editor;

// test uri "http://192.168.10.8:3000/index.html"
