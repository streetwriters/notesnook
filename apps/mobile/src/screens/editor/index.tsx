/* eslint-disable @typescript-eslint/no-var-requires */
import { EV, EVENTS } from 'notes-core/common';
import React, { forwardRef, ReactElement, useEffect, useImperativeHandle, useState } from 'react';
import { Platform, ViewStyle } from 'react-native';
import WebView from 'react-native-webview';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { notesnook } from '../../../e2e/test.ids';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useEditorStore } from '../../stores/use-editor-store';
import { getElevation } from '../../utils';
import { db } from '../../utils/database';
import { openLinkInBrowser } from '../../utils/functions';
import { NoteType } from '../../utils/types';
import { EDITOR_URI } from './source';
import { EditorProps, useEditorType } from './tiptap/types';
import { useEditor } from './tiptap/use-editor';
import { useEditorEvents } from './tiptap/use-editor-events';
import { editorController } from './tiptap/utils';

const style: ViewStyle = {
  height: '100%',
  maxHeight: '100%',
  width: '100%',
  alignSelf: 'center',
  backgroundColor: 'transparent'
};
const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
  if (request.url.includes('https')) {
    if (Platform.OS === 'ios' && !request.isTopFrame) return true;
    openLinkInBrowser(request.url);
    return false;
  } else {
    return true;
  }
};

const Editor = React.memo(
  forwardRef<
    {
      get: () => useEditorType;
    },
    EditorProps
  >(
    (
      {
        readonly = false,
        noToolbar = false,
        noHeader = false,
        withController = true,
        editorId = '',
        onLoad,
        onChange,
        theme
      },
      ref
    ) => {
      const editor = useEditor(editorId || '', readonly, onChange, theme);
      const onMessage = useEditorEvents(editor, {
        readonly,
        noToolbar,
        noHeader
      });

      useImperativeHandle(ref, () => ({
        get: () => editor
      }));

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
        eSubscribeEvent('webview_reset', onError);
        EV.subscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
        return () => {
          eUnSubscribeEvent('webview_reset', onError);
          EV.unsubscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
        };
      }, []);

      if (withController) {
        //@ts-ignore
        editorController.current = editor;
      }

      const onError = () => {
        console.log('RENDER PROCESS GONE!!!');
        editor.setLoading(true);
        setTimeout(() => editor.setLoading(false), 10);
      };
      console.log(editor.loading, 'loading editor');
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
            injectedJavaScript={`globalThis.sessionId="${editor.sessionId}";`}
            javaScriptEnabled={true}
            focusable={true}
            setSupportMultipleWindows={false}
            overScrollMode="never"
            scrollEnabled={false}
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
            hideKeyboardAccessoryView={false}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={['*']}
            source={{
              uri: __DEV__ ? 'http://192.168.10.6:3000' : EDITOR_URI
            }}
            style={style}
            autoManageStatusBarEnabled={false}
            onMessage={onMessage || undefined}
          />
          {editorId === 'shareEditor' ? null : <AppSection editor={editor} editorId={editorId} />}
        </>
      );
    }
  ),
  () => true
);

export default Editor;

//@ts-ignore
let EditorOverlay: React.ElementType;
//@ts-ignore
let IconButton: React.ElementType;
//@ts-ignore
const AppSection = ({ editor, editorId }) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    //@ts-ignore
    EditorOverlay = require('./loading.js').default;
    //@ts-ignore
    IconButton = require('../../components/ui/icon-button/index.tsx').IconButton;
    setLoaded(true);
  }, []);
  return loaded ? (
    <>
      {EditorOverlay ? <EditorOverlay editorId={editorId || ''} editor={editor} /> : null}
      <ReadonlyButton editor={editor} />
    </>
  ) : null;
};

const ReadonlyButton = ({ editor }: { editor: useEditorType }) => {
  const readonly = useEditorStore(state => state.readonly);
  const onPress = async () => {
    if (editor.note.current) {
      await db.notes?.note(editor.note.current.id).readonly();
      editor.note.current = db.notes?.note(editor.note.current.id).data as NoteType;
      useEditorStore.getState().setReadonly(false);
    }
  };

  return readonly && IconButton ? (
    <IconButton
      name="pencil-lock"
      type="grayBg"
      onPress={onPress}
      color="accent"
      customStyle={{
        position: 'absolute',
        bottom: 20,
        width: 60,
        height: 60,
        right: 12,
        ...getElevation(5)
      }}
    />
  ) : null;
};

// test uri "http://192.168.10.8:3000/index.html"
