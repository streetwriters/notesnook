import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect
} from "react";
import { WebView } from "react-native-webview";
import { EDITOR_URI } from "../app/screens/editor/source";
import { Linking } from "react-native";
import { EditorEvents, post } from "../app/screens/editor/tiptap/utils";
import Commands from "../app/screens/editor/tiptap/commands";
import { useShareStore } from "./store";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../app/services/event-manager";
import { eOnLoadNote } from "../app/utils/events";
import { getDefaultPresets } from "@notesnook/editor/dist/toolbar/tool-definitions";
import { useSettingStore } from "../app/stores/use-setting-store";
import { EventTypes } from "../app/screens/editor/tiptap/editor-events";

const useEditor = () => {
  const ref = useRef();
  const [sessionId, setSessionId] = useState("share-editor-session");
  const colors = useShareStore((state) => state.colors);
  const accent = useShareStore((state) => state.accent);
  const commands = useMemo(() => new Commands(ref), [ref]);
  const currentNote = useRef();

  const postMessage = useCallback(
    async (type, data) => post(ref, sessionId, type, data),
    []
  );

  const loadNote = (note) => {
    postMessage(EditorEvents.html, note.content.data);
    currentNote.current = note;
  };

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote + "shareEditor", loadNote);
    return () => {
      eUnSubscribeEvent(eOnLoadNote + "shareEditor", loadNote);
    };
  }, [loadNote]);

  const onLoad = () => {
    postMessage(EditorEvents.theme, { ...colors, accent });
    commands.setInsets({ top: 0, left: 0, right: 0, bottom: 0 });
  };

  return { ref, onLoad, sessionId, currentNote, commands };
};

const useEditorEvents = (editor,onChange) => {
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
        logger.info("[WEBVIEW LOG]", editorMessage.value);
        break;
      case EventTypes.content:
        logger.info("[WEBVIEW LOG]", "EditorTypes.content");
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
  const editor = useEditor();
  const onMessage = useEditorEvents(editor, onChange);

  useLayoutEffect(() => {
    onLoad?.();
  }, [onLoad]);

  return (
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
  );
};
