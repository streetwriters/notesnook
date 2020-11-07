import React, {createRef} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  TextInput,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import {useTracked} from '../../provider';
import {
  _onMessage,
  _onShouldStartLoadWithRequest,
  EditorWebView,
  injectedJS,
  onWebViewLoad,
  sourceUri,
  textInput,
} from './Functions';
import {DDS} from '../../services/DeviceDetection';
import EditorHeader from './EditorHeader';

const Editor = ({noMenu}) => {
  const [state] = useTracked();
  const {colors, premiumUser} = state;
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor:
          DDS.isTab && !DDS.isSmallTab ? 'transparent' : colors.bg,
        height: '100%',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
      <TextInput
        ref={textInput}
        style={{height: 1, padding: 0, width: 1, position: 'absolute'}}
        blurOnSubmit={false}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{
          height: '100%',
          width: '100%',
        }}>
        <EditorHeader noMenu={noMenu} />
        <WebView
          testID="editor"
          ref={EditorWebView}
          onError={(error) => console.log(error)}
          onLoad={async () => await onWebViewLoad(noMenu, premiumUser, colors)}
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
            marginTop:
              DDS.isTab && !DDS.isSmallTab
                ? Platform.OS === 'ios'
                  ? 0
                  : StatusBar.currentHeight
                : 0,
          }}
          onMessage={_onMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Editor;
