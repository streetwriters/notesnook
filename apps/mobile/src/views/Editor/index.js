import React, {useEffect, useState} from 'react';
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

const source =
  Platform.OS === 'ios'
    ? {uri: sourceUri}
    : {
        uri: 'file:///android_asset/texteditor.html',
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
      console.log('resetting now');
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
    },[loading]);

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
        <EditorHeader />
        <WebView
          testID={notesnook.ids.default.editor}
          ref={EditorWebView}
          onLoad={onLoad}
          onError={(event) => {
            ToastEvent.show('Editor Load Error', 'error');
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
      </>
    );
  },
  () => true,
);

export default Editor;
