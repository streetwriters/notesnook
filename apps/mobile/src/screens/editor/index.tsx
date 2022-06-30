import { EV, EVENTS } from 'notes-core/common';
import React, { useEffect } from 'react';
import { Linking, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { notesnook } from '../../../e2e/test.ids';
import EditorOverlay from './loading';
import { EditorProps } from './tiptap/types';
import { useEditor } from './tiptap/use-editor';
import { useEditorEvents } from './tiptap/use-editor-events';
import { editorController } from './tiptap/utils';

const sourceUri = '';
const source = { uri: sourceUri + 'index.html' };

const style: ViewStyle = {
  height: '100%',
  maxHeight: '100%',
  width: '100%',
  alignSelf: 'center',
  backgroundColor: 'transparent'
};
const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
  Linking.openURL(request.url);
  return false;
};

const Editor = React.memo(
  ({ readonly, noToolbar, noHeader, withController, editorId, onLoad }: EditorProps) => {
    const editor = useEditor(editorId || '', readonly);
    const onMessage = useEditorEvents(editor, { readonly, noToolbar, noHeader });

    const onMediaDownloaded = ({
      hash,
      groupId,
      src
    }: {
      hash: string;
      groupId: string;
      src: string;
    }) => {
      console.log('onMediaDownoaded', groupId);
      if (groupId !== editor.note.current?.id) return;
      editor.commands.updateImage({
        hash: hash,
        src: src
      });
    };

    useEffect(() => {
      onLoad && onLoad();
      EV.subscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
      return () => {
        EV.unsubscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
      };
    }, []);

    if (withController) {
      //@ts-ignore
      editorController.current = editor;
    }

    const onError = () => {
      editor.setLoading(true);
      setTimeout(() => editor.setLoading(false), 10);
    };

    return editor.loading ? null : (
      <>
        <WebView
          testID={notesnook.editor.id}
          ref={editor.ref}
          onLoad={editor.onLoad}
          onRenderProcessGone={onError}
          nestedScrollEnabled
          onError={onError}
          injectedJavaScriptBeforeContentLoaded={`
        globalThis.readonly=${readonly};
        globalThis.noToolbar=${noToolbar};
        globalThis.noHeader=${noHeader};
        `}
          injectedJavaScript={`
        globalThis.sessionId="${editor.sessionId}";`}
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
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          originWhitelist={['*']}
          source={{
            uri: 'http://localhost:3000'
          }}
          style={style}
          autoManageStatusBarEnabled={false}
          onMessage={onMessage || undefined}
        />
        <EditorOverlay editorId={editorId || ''} editor={editor} />
      </>
    );
  },
  () => true
);

export default Editor;

// test uri "http://192.168.10.8:3000/index.html"
