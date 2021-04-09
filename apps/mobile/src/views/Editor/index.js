import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {Dimensions} from 'react-native';
import {Platform, ScrollView, TextInput} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {getCurrentColors} from '../../utils/Colors';
import {normalize} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import EditorHeader from './EditorHeader';
import {
  EditorWebView,
  getNote,
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
    const insets = useSafeAreaInsets();
    const onLoad = async () => {
      await onWebViewLoad(premiumUser, getCurrentColors());
    };

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

    const CustomView = Platform.OS === 'ios' ? ScrollView : View;

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
            width:"100%",
            paddingBottom: Platform.OS === 'android' ? normalize(50) + 5 : null,
          
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
            height: '100%',
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
        </CustomView>
        <EditorToolbar />
      </>
    );
  },
  () => true,
);

export default Editor;
