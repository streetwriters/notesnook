import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import {useTracked} from '../../provider';
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

const Editor = () => {
  const [state] = useTracked();
  const {colors, premiumUser} = state;
  return (
    <>
      <TextInput
        ref={textInput}
        style={{height: 1, padding: 0, width: 1, position: 'absolute'}}
        blurOnSubmit={false}
      />
      <EditorHeader />
      <WebView
        testID="editor"
        ref={EditorWebView}
        onError={(error) => console.log(error)}
        onLoad={async () => await onWebViewLoad(premiumUser, colors)}
        javaScriptEnabled={true}
        focusable={true}
        keyboardDisplayRequiresUserAction={false}
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
          alignSelf: 'center',
          backgroundColor: 'transparent',
        }}
        onMessage={_onMessage}
      />
    </>
  );
};

export default Editor;
