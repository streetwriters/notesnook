import React from 'react';
import { Linking, Platform, View } from 'react-native';
import WebView from 'react-native-webview';
import { notesnook } from '../../../e2e/test.ids';
import { useUserStore } from '../../stores/use-user-store';
import { useEditor } from './tiptap/use-editor';
import { useEditorEvents } from './tiptap/use-editor-events';
import { editorController } from './tiptap/utils';

const sourceUri = '';

const source = { uri: sourceUri + 'index.html' };

const style = {
  height: '100%',
  maxHeight: '100%',
  width: '100%',
  alignSelf: 'center',
  backgroundColor: 'transparent'
};
const off = true;
const Editor = React.memo(
  () => {
    const premiumUser = useUserStore(state => state.premium);
    const editor = useEditor();
    const onMessage = useEditorEvents(editor);
    editorController.current = editor;

    const onError = () => {
      console.log('onError');
      editorController.current?.setLoading(true);
      setTimeout(() => editorController.current?.setLoading(false), 10);
    };

    const onShouldStartLoadWithRequest = request => {
      Linking.openURL(request.url);
      return false;
    };

    return editor.loading || off ? null : (
      <>
        <View
          style={{
            flexGrow: 1,
            backgroundColor: 'transparent',
            flex: 1
          }}
        >
          <WebView
            testID={notesnook.editor.id}
            ref={editor.ref}
            onLoad={editor.onLoad}
            onRenderProcessGone={onError}
            onError={onError}
            injectedJavaScript={`globalThis.sessionId="${editor.sessionId}";`}
            javaScriptEnabled={true}
            focusable={true}
            setSupportMultipleWindows={false}
            overScrollMode="never"
            keyboardDisplayRequiresUserAction={false}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            cacheMode="LOAD_DEFAULT"
            cacheEnabled={true}
            domStorageEnabled={true}
            bounces={false}
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            allowFileAccess={true}
            scalesPageToFit={true}
            renderLoading={() => <View />}
            startInLoadingState
            hideKeyboardAccessoryView={true}
            allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={['*']}
            source={{
              uri: 'http://192.168.10.7:3000'
            }}
            style={style}
            autoManageStatusBarEnabled={false}
            onMessage={onMessage}
          />
        </View>
      </>
    );
  },
  () => true
);

export default Editor;

// test uri "http://192.168.10.8:3000/index.html"
