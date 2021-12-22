import React, {useEffect, useState} from 'react';
import {Platform, ScrollView, TextInput, View} from 'react-native';
import WebView from 'react-native-webview';
import {notesnook} from '../../../e2e/test.ids';
import {useEditorStore, useUserStore} from '../../provider/stores';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import {getCurrentColors} from '../../utils/Colors';
import {eOnLoadNote} from '../../utils/Events';
import {normalize} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import EditorHeader from './EditorHeader';
import {
  EditorWebView,
  getNote,
  onWebViewLoad,
  sourceUri,
  textInput,
  _onMessage,
  _onShouldStartLoadWithRequest
} from './Functions';
import tiny from './tiny/tiny';
import EditorToolbar from './tiny/toolbar';

const source = {uri: sourceUri + 'index.html'};

const style = {
  height: '100%',
  maxHeight: '100%',
  width: '100%',
  alignSelf: 'center',
  backgroundColor: 'transparent'
};

const CustomView = Platform.OS === 'ios' ? ScrollView : View;

const Editor = React.memo(
  () => {
    const premiumUser = useUserStore(state => state.premium);
    const sessionId = useEditorStore(state => state.sessionId);
    const [resetting, setResetting] = useState(false);
    const onLoad = async () => {
      await onWebViewLoad(premiumUser, getCurrentColors());
    };
    console.log(sessionId, 'updated id');

    useEffect(() => {
      if (premiumUser) {
        tiny.call(EditorWebView, tiny.setMarkdown, true);
      }
    }, [premiumUser]);

    const onResetRequested = async noload => {
      setResetting(true);
      await sleep(30);
      setResetting(false);
      eSendEvent(eOnLoadNote, getNote() ? getNote() : {type: 'new'});
      if (!getNote()) {
        await sleep(10);
        eSendEvent('loadingNote', null);
      }
    };

    useEffect(() => {
      eSubscribeEvent('webviewreset', onResetRequested);
      return () => {
        eUnSubscribeEvent('webviewreset', onResetRequested);
      };
    }, []);

    const androidStyle = Platform.OS == 'android' ? {flexGrow: 1, flex: 1} : {};

    return resetting ? null : (
      <>
        <CustomView
          style={[
            {
              width: '100%',
              backgroundColor: 'transparent'
            },
            androidStyle
          ]}
          bounces={false}
          bouncesZoom={false}
          disableScrollViewPanResponder
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          nestedScrollEnabled
          contentContainerStyle={{
            width: '100%',
            height: '100%'
          }}>
          <EditorHeader />
          <WebView
            testID={notesnook.editor.id}
            ref={EditorWebView}
            onLoad={onLoad}
            scrollEnabled={true}
            onRenderProcessGone={event => {
              onResetRequested();
            }}
            injectedJavaScript={`
            sessionId="${sessionId}";
            console.log(sessionId);
            (function() {
              const func = function() {
                setTimeout(function() {
                  if (tinymce) {
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
            allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={['*']}
            source={source}
            //source={{uri:"http://192.168.10.4:3000/index.html"}}
            style={style}
            autoManageStatusBarEnabled={false}
            onMessage={_onMessage}
          />
        </CustomView>
        <EditorToolbar />
      </>
    );
  },
  () => true
);

export default Editor;

// test uri "http://192.168.10.8:3000/index.html"
