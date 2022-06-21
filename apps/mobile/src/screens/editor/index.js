import React from 'react';
import { Linking, Platform } from 'react-native';
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
const onShouldStartLoadWithRequest = request => {
  Linking.openURL(request.url);
  return false;
};

const Editor = React.memo(
  () => {
    const premiumUser = useUserStore(state => state.premium);
    const editor = useEditor();
    const onMessage = useEditorEvents(editor);
    editorController.current = editor;

    const onError = () => {
      editorController.current?.setLoading(true);
      setTimeout(() => editorController.current?.setLoading(false), 10);
    };

    return editor.loading ? null : (
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
        hideKeyboardAccessoryView={true}
        allowingReadAccessToURL={Platform.OS === 'android' ? true : null}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        source={{
          uri: 'http://192.168.10.5:3000'
        }}
        style={style}
        autoManageStatusBarEnabled={false}
        onMessage={onMessage}
      />
    );
  },
  () => true
);

export default Editor;

// test uri "http://192.168.10.8:3000/index.html"
