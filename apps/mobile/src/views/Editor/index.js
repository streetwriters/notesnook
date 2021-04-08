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
import { normalize } from '../../utils/SizeUtils';
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
    const calculatedHeight =
      Dimensions.get('window').height - (insets.top + insets.bottom + normalize(50));
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

    return resetting ? null : (
      <>
        <TextInput
          ref={textInput}
          style={{height: 1, padding: 0, width: 1, position: 'absolute'}}
          blurOnSubmit={false}
        />
        <View
          style={{
            height: calculatedHeight,
          }}
          nestedScrollEnabled>
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
        </View>
        <EditorToolbar />
      </>
    );
  },
  () => true,
);

export default Editor;
