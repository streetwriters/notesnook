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
import { EV, EVENTS } from "@notesnook/core/dist/common";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions
} from "react-native";
import WebView from "react-native-webview";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { notesnook } from "../../../e2e/test.ids";
import { db } from "../../common/database";
import { IconButton } from "../../components/ui/icon-button";
import useKeyboard from "../../hooks/use-keyboard";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  openVault
} from "../../services/event-manager";
import { getElevationStyle } from "../../utils/elevation";
import { openLinkInBrowser } from "../../utils/functions";
import EditorOverlay from "./loading";
import { EDITOR_URI } from "./source";
import { EditorProps, useEditorType } from "./tiptap/types";
import { useEditor } from "./tiptap/use-editor";
import { useEditorEvents } from "./tiptap/use-editor-events";
import { useTabStore } from "./tiptap/use-tab-store";
import { editorController, editorState } from "./tiptap/utils";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { useThemeColors } from "@notesnook/theme";
import { Button } from "../../components/ui/button";
import Heading from "../../components/ui/typography/heading";
import Seperator from "../../components/ui/seperator";
import Paragraph from "../../components/ui/typography/paragraph";
import { useDBItem } from "../../hooks/use-db-item";
import Input from "../../components/ui/input";
import BiometicService from "../../services/biometrics";
import { eOnLoadNote, eUnlockNote } from "../../utils/events";
import Menu, {
  MenuItem,
  MenuDivider
} from "react-native-reanimated-material-menu";

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
        onChange
      },
      ref
    ) => {
      const editor = useEditor(editorId || "", readonly, onChange);
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
          const exists = editor.note.current[groupId];
          if (!exists) return;
          const tabId = useTabStore.getState().getTabForNote(groupId);
          if (typeof tabId === "undefined") return;
          editorController.current.markImageLoaded(groupId, hash);
          if (attachmentType === "webclip") {
            editor.commands.updateWebclip(
              {
                hash: hash,
                src: src
              },
              tabId
            );
          } else {
            editor.commands.updateImage(
              {
                hash: hash,
                dataurl: src
              },
              tabId
            );
          }
        },
        [editor.commands, editor.note]
      );

      const onError = useCallback(() => {
        renderKey.current =
          renderKey.current === `editor-0` ? `editor-1` : `editor-0`;
        editor.state.current.ready = false;
        editor.setLoading(true);
      }, [editor]);

      useEffect(() => {
        const sub = [
          eSubscribeEvent("webview_reset", onError),
          EV.subscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded)
        ];

        return () => {
          sub.forEach((s) => s.unsubscribe());
          EV.unsubscribe(EVENTS.mediaAttachmentDownloaded, onMediaDownloaded);
        };
      }, [onError, onMediaDownloaded]);

      useLayoutEffect(() => {
        setImmediate(() => {
          onLoad && onLoad();
        });
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
            useSharedProcessPool={false}
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
          <EditorOverlay editorId={editorId || ""} editor={editor} />
          <ReadonlyButton editor={editor} />
          <LockOverlay />
        </>
      );
    }
  ),
  () => true
);

export default Editor;

const LockOverlay = () => {
  const tab = useTabStore((state) =>
    state.tabs.find((t) => t.id === state.currentTab)
  );
  const { height } = useWindowDimensions();
  const [item] = useDBItem(tab?.noteId, "note");
  const isLocked = item?.locked && tab?.locked;
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();
  const password = useRef<string>();
  const passInputRef = useRef<TextInput>(null);
  const [biometryEnrolled, setBiometryEnrolled] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [enrollBiometrics, setEnrollBiometrics] = useState(false);

  console.log("Tab locked", item?.locked, tab?.locked);

  useEffect(() => {
    (async () => {
      let biometry = await BiometicService.isBiometryAvailable();
      let fingerprint = await BiometicService.hasInternetCredentials();
      setBiometryAvailable(!!biometry);
      setBiometryEnrolled(!!fingerprint);
    })();
  }, [isLocked]);

  const unlockWithBiometrics = async () => {
    try {
      if (!item || !tab) return;
      console.log("Trying to unlock with biometrics...");
      let credentials = await BiometicService.getCredentials(
        "Unlock note",
        "Unlock note to open it in editor. If biometrics are not working, you can enter device pin to unlock vault."
      );

      if (credentials && credentials?.password) {
        let note = await db.vault.open(item.id, credentials?.password);
        eSendEvent(eOnLoadNote, {
          item: note
        });
        useTabStore.getState().updateTab(tab.id, {
          locked: false
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const unlock = () => {
      if (
        isLocked &&
        biometryAvailable &&
        biometryEnrolled &&
        !editorState().movedAway
      ) {
        unlockWithBiometrics();
      } else {
        console.log("Biometrics unavailable.");
        if (isLocked && !editorState().movedAway) {
          setTimeout(() => {
            passInputRef.current?.focus();
          }, 300);
        }
      }
    };

    const sub = eSubscribeEvent(eUnlockNote, unlock);
    unlock();
    return () => {
      sub.unsubscribe();
    };
  }, [isLocked, biometryAvailable, biometryEnrolled]);

  const onSubmit = async () => {
    if (!item || !tab) return;

    if (!password.current || password.current.trim().length === 0) {
      ToastManager.show({
        heading: "Password not entered",
        message: "Enter a password for the vault and try again.",
        type: "error"
      });
      return;
    }

    try {
      let note = await db.vault.open(item.id, password.current);
      if (enrollBiometrics) {
        try {
          await db.vault.unlock(password.current);
          await BiometicService.storeCredentials(password.current);
          eSendEvent("vaultUpdated");
          ToastManager.show({
            heading: "Biometric unlocking enabled!",
            message: "Now you can unlock notes in vault with biometrics.",
            type: "success",
            context: "global"
          });
        } catch (e) {
          ToastManager.show({
            heading: "Incorrect password",
            message:
              "Please enter the correct vault password to enable biometrics.",
            type: "error",
            context: "local"
          });
        }
      }
      eSendEvent(eOnLoadNote, {
        item: note
      });
      useTabStore.getState().updateTab(tab.id, {
        locked: false
      });
    } catch (e) {
      console.log(e);
      ToastManager.show({
        heading: "Incorrect password",
        type: "error",
        context: "local"
      });
    }
  };

  return isLocked ? (
    <ScrollView
      style={{
        width: "100%",
        height: height,
        backgroundColor: colors.primary.background,
        position: "absolute",
        top: 50 + insets.top,
        zIndex: 999
      }}
      contentContainerStyle={{
        alignItems: "center",
        justifyContent: "center",
        height: height
      }}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <Heading>{item.title}</Heading>
      <Paragraph>This note is locked.</Paragraph>
      <Seperator />
      <Input
        fwdRef={passInputRef}
        autoCapitalize="none"
        testID={notesnook.ids.dialogs.vault.pwd}
        onChangeText={(value) => {
          password.current = value;
        }}
        wrapperStyle={{
          width: 300
        }}
        marginBottom={10}
        onSubmit={() => {
          onSubmit();
        }}
        autoComplete="password"
        returnKeyLabel="Unlock"
        returnKeyType={"done"}
        secureTextEntry
        placeholder="Password"
      />

      <Button
        title="Unlock note"
        type="accent"
        onPress={() => {
          onSubmit();
        }}
      />

      {biometryAvailable && !biometryEnrolled ? (
        <Button
          title="Enable biometric unlocking"
          type={enrollBiometrics ? "accent" : "gray"}
          onPress={() => {
            setEnrollBiometrics(!enrollBiometrics);
          }}
          style={{
            marginTop: 10
          }}
          icon={
            enrollBiometrics
              ? "check-circle-outline"
              : "checkbox-blank-circle-outline"
          }
          iconSize={20}
        />
      ) : biometryEnrolled && biometryAvailable ? (
        <IconButton
          name="fingerprint"
          type="gray"
          customStyle={{
            marginTop: 20
          }}
          size={40}
          onPress={() => {
            unlockWithBiometrics();
          }}
        />
      ) : null}
    </ScrollView>
  ) : null;
};

const ReadonlyButton = ({ editor }: { editor: useEditorType }) => {
  const readonly = useTabStore(
    (state) => state.tabs.find((t) => t.id === state.currentTab)?.readonly
  );

  const keyboard = useKeyboard();

  const onPress = async () => {
    const noteId = useTabStore
      .getState()
      .getNoteIdForTab(useTabStore.getState().currentTab);
    if (noteId) {
      await db.notes.readonly(!editor.note.current.readonly, noteId);
      editor.note.current[noteId] = await db.notes?.note(noteId);

      useTabStore.getState().updateTab(useTabStore.getState().currentTab, {
        readonly: editor.note.current[noteId as string]?.readonly
      });
    }
  };

  return readonly && !keyboard.keyboardShown ? (
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
