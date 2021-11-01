import React, {useEffect, useState} from 'react';
import {Platform, ScrollView, TextInput, View} from 'react-native';
import WebView from 'react-native-webview';
import {notesnook} from '../../../e2e/test.ids';
import {useUserStore} from '../../provider/stores';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import {getCurrentColors} from '../../utils/Colors';
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

    const [resetting, setResetting] = useState(false);
    const onLoad = async () => {
      await onWebViewLoad(premiumUser, getCurrentColors());
    };

    useEffect(() => {
      if (premiumUser) {
        tiny.call(EditorWebView, tiny.setMarkdown, true);
      }
    }, [premiumUser]);

    const onResetRequested = async noload => {
      setResetting(true);
      await sleep(30);
      setResetting(false);
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

    return resetting ? null : (
      <>
        <TextInput
          ref={textInput}
          style={{height: 1, padding: 0, width: 1, position: 'absolute'}}
          blurOnSubmit={false}
        />

        <CustomView
          style={{
            height: '100%',
            width: '100%',
            paddingBottom: Platform.OS === 'android' ? normalize(50) + 5 : null
          }}
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
            testID={notesnook.ids.default.editor}
            ref={EditorWebView}
            onLoad={onLoad}
            scrollEnabled={true}
            onRenderProcessGone={event => {
              onResetRequested();
            }}
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
            allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={['*']}
            source={source}
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
