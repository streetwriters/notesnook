import React, {useEffect, useState} from 'react';
import {ScrollView} from 'react-native';
import {View} from 'react-native';
import {Platform, TextInput} from 'react-native';
import WebView from 'react-native-webview';
import {notesnook} from '../../../e2e/test.ids';
import {Loading} from '../../components/Loading';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {getCurrentColors} from '../../utils/Colors';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import EditorHeader from './EditorHeader';
import {
  editorTitleInput,
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
    const {premiumUser, loading} = state;
    const [resetting, setResetting] = useState(false);

    const onLoad = async () => {
      await onWebViewLoad(premiumUser, getCurrentColors());
    };

    const onResetRequested = async () => {
      setResetting(true);
      await sleep(3000);
      ToastEvent.show('Editor has recovered from crash.', 'success');
      setResetting(false);
    };

    useEffect(() => {
      if (!loading) {
        eSubscribeEvent('webviewreset', onResetRequested);
      }
      return () => {
        eUnSubscribeEvent('webviewreset', onResetRequested);
      };
    }, [loading]);

    return resetting || loading ? (
      <Loading
        tagline={resetting ? 'Reloading Editor' : 'Loading Editor'}
        height="100%"
      />
    ) : (
      <>
        <TextInput
          ref={textInput}
          style={{height: 1, padding: 0, width: 1, position: 'absolute'}}
          blurOnSubmit={false}
        />
        <ScrollView
          bounces={false}
          bouncesZoom={false}
          showsVerticalScrollIndicator={false}
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
            onError={(event) => {
              console.log('error', event.nativeEvent);
              ToastEvent.show('Editor Load Error', 'error');
            }}
            onRenderProcessGone={(event) => {
              console.log('error', event.nativeEvent);
              onResetRequested();
              ToastEvent.show('Editor Render Process Gone', 'error');
            }}
            javaScriptEnabled={true}
            focusable={true}
            keyboardDisplayRequiresUserAction={false}
            injectedJavaScript={Platform.OS === 'ios' ? injectedJS : null}
            onShouldStartLoadWithRequest={_onShouldStartLoadWithRequest}
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
            source={source}
            style={style}
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
