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
import React, { useEffect, useState } from "react";
import { Platform, View, ViewStyle } from "react-native";
import { openLinkInBrowser } from "../../utils/functions";
import {
  ShouldStartLoadRequest,
  WebViewMessageEvent
} from "react-native-webview/lib/WebViewTypes";
import WebView from "react-native-webview";
import { useRef } from "react";
import { EDITOR_URI } from "./source";
import { EditorMessage } from "./tiptap/types";
import { EditorEvents } from "@notesnook/editor-mobile/src/utils/editor-events";
import { Attachment } from "@notesnook/editor";
import downloadAttachment from "../../common/filesystem/download-attachment";
import { NativeEvents } from "@notesnook/editor-mobile/src/utils/native-events";
import { useThemeColors } from "@notesnook/theme";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { db } from "../../common/database";
import { i18n } from "@lingui/core";
import { defaultBorderRadius } from "../../utils/size";

const onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
  if (request.url.includes("https")) {
    if (Platform.OS === "ios" && !request.isTopFrame) return true;
    openLinkInBrowser(request.url);
    return false;
  } else {
    return true;
  }
};

const style: ViewStyle = {
  height: "100%",
  maxHeight: "100%",
  width: "100%",
  alignSelf: "center",
  backgroundColor: "transparent"
};

export function ReadonlyEditor(props: {
  onLoad: (
    loadContent: (content: { data: string; id: string }) => void
  ) => void;
  editorId: string;
}) {
  const { colors } = useThemeColors();
  const editorRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const insets = useGlobalSafeAreaInsets();
  const noteId = useRef<string>();
  const onMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    const editorMessage = JSON.parse(data) as EditorMessage<any>;

    if (editorMessage.type === EditorEvents.logger) {
      logger.info("[READONLY EDITOR LOG]", editorMessage.value);
    }

    if (editorMessage.type === EditorEvents.readonlyEditorLoaded) {
      props.onLoad?.((content: { data: string; id: string }) => {
        setTimeout(() => {
          noteId.current = content.id;
          editorRef.current?.postMessage(
            JSON.stringify({
              type: "native:html",
              value: content.data
            })
          );
          setLoading(false);
        }, 300);
      });
    } else if (editorMessage.type === EditorEvents.getAttachmentData) {
      const attachment = (editorMessage.value as any).attachment as Attachment;

      downloadAttachment(attachment.hash, true, {
        base64: attachment.type === "image",
        text: attachment.type === "web-clip",
        silent: true,
        groupId: noteId.current,
        cache: true
      } as any)
        .then((data: any) => {
          console.log(
            "Got attachment data:",
            !!data,
            (editorMessage.value as any).resolverId
          );
          editorRef.current?.postMessage(
            JSON.stringify({
              type: NativeEvents.attachmentData,
              value: {
                resolverId: (editorMessage.value as any).resolverId,
                data
              }
            })
          );
        })
        .catch(() => {
          editorRef.current?.postMessage(
            JSON.stringify({
              type: NativeEvents.attachmentData,
              data: {
                resolverId: (editorMessage.value as any).resolverId,
                data: undefined
              }
            })
          );
        });
    }
  };

  useEffect(() => {
    const groupId = noteId.current;
    return () => {
      if (groupId) {
        db.fs().cancel(groupId);
      }
    };
  }, [loading]);

  return (
    <>
      <WebView
        ref={editorRef}
        key={"readonly-editor:" + props.editorId}
        nestedScrollEnabled
        injectedJavaScript={`
        globalThis.__DEV__ = ${__DEV__}
        globalThis.readonlyEditor=true;
        globalThis.LINGUI_LOCALE = "${i18n.locale}";
        globalThis.LINGUI_LOCALE_DATA = ${JSON.stringify({
          [i18n.locale]: i18n.messages
        })};
        globalThis.loadApp();`}
        useSharedProcessPool={false}
        javaScriptEnabled={true}
        webviewDebuggingEnabled={__DEV__}
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

      {loading ? (
        <View
          style={[
            {
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: colors.primary.background,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100
            }
          ]}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: colors.primary.background,
              borderRadius: defaultBorderRadius,
              height: "100%",
              alignItems: "flex-start",
              paddingTop: insets.top
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                width: "100%",
                alignItems: "flex-start"
              }}
            >
              <View
                style={{
                  height: 25,
                  width: "100%",
                  backgroundColor: colors.secondary.background,
                  borderRadius: defaultBorderRadius
                }}
              />

              <View
                style={{
                  height: 12,
                  width: "100%",
                  marginTop: 10,
                  flexDirection: "row"
                }}
              >
                <View
                  style={{
                    height: 12,
                    width: 60,
                    backgroundColor: colors.secondary.background,
                    borderRadius: defaultBorderRadius,
                    marginRight: 10
                  }}
                />
                <View
                  style={{
                    height: 12,
                    width: 60,
                    backgroundColor: colors.secondary.background,
                    borderRadius: defaultBorderRadius,
                    marginRight: 10
                  }}
                />
                <View
                  style={{
                    height: 12,
                    width: 60,
                    backgroundColor: colors.secondary.background,
                    borderRadius: defaultBorderRadius,
                    marginRight: 10
                  }}
                />
              </View>

              <View
                style={{
                  height: 16,
                  width: "100%",
                  backgroundColor: colors.secondary.background,
                  borderRadius: defaultBorderRadius,
                  marginTop: 10
                }}
              />

              <View
                style={{
                  height: 16,
                  width: "100%",
                  backgroundColor: colors.secondary.background,
                  borderRadius: defaultBorderRadius,
                  marginTop: 10
                }}
              />

              <View
                style={{
                  height: 16,
                  width: 200,
                  backgroundColor: colors.secondary.background,
                  borderRadius: defaultBorderRadius,
                  marginTop: 10
                }}
              />
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}
