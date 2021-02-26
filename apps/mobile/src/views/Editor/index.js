import React, {useEffect, useState} from 'react';
import {Platform, ScrollView, TextInput} from 'react-native';
import WebView from 'react-native-webview';
import {notesnook} from '../../../e2e/test.ids';
import {Loading} from '../../components/Loading';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {getCurrentColors} from '../../utils/Colors';
import {sleep} from '../../utils/TimeUtils';
import EditorHeader from './EditorHeader';
import {
  EditorWebView,
  injectedJS,
  onWebViewLoad,
  sourceUri,
  textInput,
  _onMessage,
  _onShouldStartLoadWithRequest,
} from './Functions';
import EditorToolbar from './tiny/toolbar';

const source =
  Platform.OS === 'ios'
    ? {uri: sourceUri}
    : {
        uri: 'file:///android_asset/index.html',
        baseUrl: 'file:///android_asset/',
      };

const style = {
  height: '100%',
  maxHeight: '100%',
  width: '100%',
  alignSelf: 'center',
  backgroundColor: 'transparent',
};

const Editor = React.memo(
  () => {
    const [state] = useTracked();
    const {premiumUser} = state;
    const [resetting, setResetting] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);
    const onLoad = async () => {
      await onWebViewLoad(premiumUser, getCurrentColors());
    };

    const onResetRequested = async () => {
      setLocalLoading(true);
      setResetting(true);
      await sleep(10);
      setResetting(false);
      await sleep(10);
      setLocalLoading(false);
    };

    useEffect(() => {
      eSubscribeEvent('webviewreset', onResetRequested);

      return () => {
        eUnSubscribeEvent('webviewreset', onResetRequested);
      };
    }, []);

    return resetting || localLoading ? null : (
      <>
        <TextInput
          ref={textInput}
          style={{height: 1, padding: 0, width: 1, position: 'absolute'}}
          blurOnSubmit={false}
        />
        <ScrollView
          bounces={false}
          bouncesZoom={false}
          disableScrollViewPanResponder
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          style={{
            height: '100%',
            width: '100%',
          }}
          nestedScrollEnabled
          contentContainerStyle={{
            width: '100%',
            height: '100%',
          }}>
          <EditorHeader />
          <WebView
            testID={notesnook.ids.default.editor}
            ref={EditorWebView}
            onLoad={onLoad}
            scrollEnabled={true}
            onRenderProcessGone={(event) => {
              onResetRequested();
            }}
            javaScriptEnabled={true}
            focusable={true}
            keyboardDisplayRequiresUserAction={false}
            injectedJavaScript={Platform.OS === 'ios' ? injectedJS : null}
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
        </ScrollView>
        <EditorToolbar />
      </>
    );
  },
  () => true,
);

export default Editor;
