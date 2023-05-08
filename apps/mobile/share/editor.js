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
import { getDefaultPresets } from "@notesnook/editor/dist/toolbar/tool-definitions";
import { useThemeColors, useThemeProvider } from "@notesnook/theme";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Linking, Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import { EDITOR_URI } from "../app/screens/editor/source";
import Commands from "../app/screens/editor/tiptap/commands";
import { EventTypes } from "../app/screens/editor/tiptap/editor-events";
import { EditorEvents, post } from "../app/screens/editor/tiptap/utils";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../app/services/event-manager";
import { useSettingStore } from "../app/stores/use-setting-store";
import { eOnLoadNote } from "../app/utils/events";

const useEditor = () => {
  const ref = useRef();
  const [sessionId] = useState("share-editor-session");
  const { theme } = useThemeProvider();
  const commands = useMemo(() => new Commands(ref), [ref]);
  const currentNote = useRef();
  const doubleSpacedLines = useSettingStore(
    (state) => state.settings?.doubleSpacedLines
  );
  const postMessage = useCallback(
    async (type, data) => post(ref, sessionId, type, data),
    [sessionId]
  );

  const loadNote = useCallback(
    (note) => {
      postMessage(EditorEvents.html, note.content.data);
      currentNote.current = note;
    },
    [postMessage]
  );

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote + "shareEditor", loadNote);
    return () => {
      eUnSubscribeEvent(eOnLoadNote + "shareEditor", loadNote);
    };
  }, [loadNote]);

  const onLoad = () => {
    postMessage(EditorEvents.theme, theme);
    commands.setInsets({ top: 0, left: 0, right: 0, bottom: 0 });
    commands.setSettings({
      deviceMode: "mobile",
      fullscreen: false,
      premium: false,
      readonly: false,
      tools: getDefaultPresets().default,
      noHeader: true,
      noToolbar: true,
      keyboardShown: false,
      doubleSpacedLines: doubleSpacedLines
    });
  };

  return { ref, onLoad, sessionId, currentNote, commands };
};

const useEditorEvents = (editor, onChange) => {
  const doubleSpacedLines = useSettingStore(
    (state) => state.settings?.doubleSpacedLines
  );
  useEffect(() => {
    editor.commands.setSettings({
      deviceMode: "mobile",
      fullscreen: false,
      premium: false,
      readonly: false,
      tools: getDefaultPresets().default,
      noHeader: true,
      noToolbar: true,
      keyboardShown: false,
      doubleSpacedLines: doubleSpacedLines
    });
  }, [editor, doubleSpacedLines]);

  const onMessage = (event) => {
    const data = event.nativeEvent.data;
    const editorMessage = JSON.parse(data);
    if (
      editorMessage.sessionId !== editor.sessionId &&
      editorMessage.type !== EditorEvents.status
    ) {
      return;
    }

    switch (editorMessage.type) {
      case EventTypes.logger:
        console.log("[WEBVIEW LOG]", editorMessage.value);
        break;
      case EventTypes.content:
        console.log("[WEBVIEW LOG]", "EditorTypes.content");
        onChange(editorMessage.value);
        break;
    }
  };
  return onMessage;
};

const onShouldStartLoadWithRequest = (request) => {
  if (request.url.includes("https")) {
    if (Platform.OS === "ios" && !request.isTopFrame) return true;
    Linking.openURL(request.url);
    return false;
  } else {
    return true;
  }
};

const style = {
  height: "100%",
  maxHeight: "100%",
  width: "100%",
  alignSelf: "center",
  backgroundColor: "transparent"
};

export const Editor = ({ onChange, onLoad }) => {
  const { colors } = useThemeColors();
  const editor = useEditor();
  const onMessage = useEditorEvents(editor, onChange);
  const [loading, setLoading] = useState(true);
  useLayoutEffect(() => {
    onLoad?.();
  }, [onLoad]);

  useEffect(() => {
    setTimeout(() => {
      onLoad?.();
      setTimeout(() => setLoading(false));
    }, 1000);
  }, [onLoad]);

  return (
    <View
      style={{
        flex: 1
      }}
    >
      <WebView
        ref={editor.ref}
        onLoad={editor.onLoad}
        nestedScrollEnabled
        injectedJavaScriptBeforeContentLoaded={`
  globalThis.readonly=${false};
  globalThis.noToolbar=${true};
  globalThis.noHeader=${true};
  `}
        injectedJavaScript={`globalThis.sessionId="${editor.sessionId}";`}
        javaScriptEnabled={true}
        focusable={true}
        setSupportMultipleWindows={false}
        overScrollMode="never"
        scrollEnabled={false}
        keyboardDisplayRequiresUserAction={false}
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
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        originWhitelist={["*"]}
        source={{
          uri: EDITOR_URI
        }}
        style={style}
        autoManageStatusBarEnabled={false}
        onMessage={onMessage || undefined}
      />
      {loading ? (
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: colors.primary.background,
            alignItems: "flex-start",
            zIndex: 999,
            paddingHorizontal: 12
          }}
        >
          <View
            style={{
              height: 16,
              width: "100%",
              backgroundColor: colors.secondary.background,
              borderRadius: 5,
              marginTop: 10
            }}
          />

          <View
            style={{
              height: 16,
              width: "100%",
              backgroundColor: colors.secondary.background,
              borderRadius: 5,
              marginTop: 10
            }}
          />

          <View
            style={{
              height: 16,
              width: "60%",
              backgroundColor: colors.secondary.background,
              borderRadius: 5,
              marginTop: 10
            }}
          />
        </View>
      ) : null}
    </View>
  );
};
