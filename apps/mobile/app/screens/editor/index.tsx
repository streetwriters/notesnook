/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* eslint-disable @typescript-eslint/no-var-requires */
import { EV, EVENTS } from "@notesnook/core/common";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { Platform, ViewStyle } from "react-native";
import WebView from "react-native-webview";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { notesnook } from "../../../e2e/test.ids";
import { db } from "../../common/database";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useEditorStore } from "../../stores/use-editor-store";
import { getElevationStyle } from "../../utils/elevation";
import { openLinkInBrowser } from "../../utils/functions";
import { NoteType } from "../../utils/types";
import { EDITOR_URI } from "./source";
import { EditorProps, useEditorType } from "./tiptap/types";
import { useEditor } from "./tiptap/use-editor";
import { useEditorEvents } from "./tiptap/use-editor-events";
import { editorController } from "./tiptap/utils";
import { useLayoutEffect } from "react";
import useKeyboard from "../../hooks/use-keyboard";

const style: ViewStyle = {
  height: "100%",
  maxHeight: "100%",
  width: "100%",
  alignSelf: "center",
  backgroundColor: "transparent"
};
const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
  if (request.url.includes("https")) {
    if (Platform.OS === "ios" && !request.isTopFrame) return true;
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
        editorId = "",
        onLoad,
        onChange,
        theme
      },
      ref
    ) => {
      const editor = useEditor(editorId || "", readonly, onChange, theme);
      const onMessage = useEditorEvents(editor, {
        readonly,
        noToolbar,
        noHeader
      });
      const renderKey = useRef(`editor-0`);
      useImperativeHandle(ref, () => ({
        get: () => editor
      }));

      const onMediaDownloaded = useCallback(
        ({
          hash,
          groupId,
          src,
          attachmentType
        }: {
          hash: string;
          groupId: string;
          src: string;
          attachmentType: string;
        }) => {
          if (groupId !== editor.note.current?.id) return;
          editorController.current.markImageLoaded(hash);
          if (attachmentType === "webclip") {
            editor.commands.updateWebclip({
              hash: hash,
              src: src
            });
          } else {
            editor.commands.updateImage({
              hash: hash,
              src: src
            });
          }
        },
        [editor.commands, editor.note]
      );

      const onError = useCallback(() => {
        renderKey.current =
          renderKey.current === `editor-0` ? `editor-1` : `editor-0`;
        editor.setLoading(true);
      }, [editor]);

      useEffect(() => {
        eSubscribeEvent("webview_reset", onError);
        EV.subscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
        return () => {
          eUnSubscribeEvent("webview_reset", onError);
          EV.unsubscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
        };
      }, [onError, onMediaDownloaded]);

      useLayoutEffect(() => {
        onLoad && onLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [onLoad]);

      if (withController) {
        editorController.current = editor;
      }

      return editor.loading ? null : (
        <>
          <WebView
            testID={notesnook.editor.id}
            ref={editor.ref}
            onLoad={editor.onLoad}
            key={renderKey.current}
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
            onContentProcessDidTerminate={onError}
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
            allowsFullscreenVideo={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            originWhitelist={["*"]}
            source={{
              uri: EDITOR_URI
            }}
            style={style}
            autoManageStatusBarEnabled={false}
            onMessage={onMessage || undefined}
          />
          {editorId === "shareEditor" ? null : (
            <AppSection editor={editor} editorId={editorId} />
          )}
        </>
      );
    }
  ),
  () => true
);

export default Editor;

let EditorOverlay: React.ElementType;
let IconButton: React.ElementType;
const AppSection = ({
  editor,
  editorId
}: {
  editor: useEditorType;
  editorId: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    EditorOverlay = require("./loading.js").default;
    IconButton =
      require("../../components/ui/icon-button/index.tsx").IconButton;
    setLoaded(true);
  }, []);
  return loaded ? (
    <>
      {EditorOverlay ? (
        <EditorOverlay editorId={editorId || ""} editor={editor} />
      ) : null}
      <ReadonlyButton editor={editor} />
    </>
  ) : null;
};

const ReadonlyButton = ({ editor }: { editor: useEditorType }) => {
  const readonly = useEditorStore((state) => state.readonly);
  const keyboard = useKeyboard();

  const onPress = async () => {
    if (editor.note.current) {
      await db.notes?.note(editor.note.current.id).readonly();
      editor.note.current = db.notes?.note(editor.note.current.id)
        .data as NoteType;
      useEditorStore.getState().setReadonly(false);
    }
  };

  return readonly && IconButton && !keyboard.keyboardShown ? (
    <IconButton
      name="pencil-lock"
      type="grayBg"
      onPress={onPress}
      color="accent"
      customStyle={{
        position: "absolute",
        bottom: 60,
        width: 60,
        height: 60,
        right: 12,
        ...getElevationStyle(5)
      }}
    />
  ) : null;
};
