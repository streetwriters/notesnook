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

/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-var-requires */
import type { Attachment } from "@notesnook/editor/dist/extensions/attachment/index";
import { getDefaultPresets } from "@notesnook/editor/dist/toolbar/tool-definitions";
import { useCallback, useEffect, useRef } from "react";
import {
  BackHandler,
  InteractionManager,
  Keyboard,
  KeyboardEventListener,
  NativeEventSubscription
} from "react-native";
import { WebViewMessageEvent } from "react-native-webview";
import { db } from "../../../common/database";
import ManageTagsSheet from "../../../components/sheets/manage-tags";
import { RelationsList } from "../../../components/sheets/relations-list";
import ReminderSheet from "../../../components/sheets/reminder";
import { DDS } from "../../../services/device-detection";
import {
  ToastEvent,
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useEditorStore } from "../../../stores/use-editor-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useTagStore } from "../../../stores/use-tag-store";
import { useUserStore } from "../../../stores/use-user-store";
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenLoginDialog,
  eOpenPremiumDialog,
  eOpenPublishNoteDialog
} from "../../../utils/events";
import { openLinkInBrowser } from "../../../utils/functions";
import { tabBarRef } from "../../../utils/global-refs";
import { NoteType } from "../../../utils/types";
import { useDragState } from "../../settings/editor/state";
import { EventTypes } from "./editor-events";
import { EditorMessage, EditorProps, useEditorType } from "./types";
import { EditorEvents, editorState } from "./utils";
import { useNoteStore } from "../../../stores/use-notes-store";

const publishNote = async (editor: useEditorType) => {
  const user = useUserStore.getState().user;
  if (!user) {
    ToastEvent.show({
      heading: "Login required",
      message: "Login to publish",
      context: "global",
      func: () => {
        eSendEvent(eOpenLoginDialog);
      },
      actionText: "Login"
    });
    return;
  }

  if (!user?.isEmailConfirmed) {
    ToastEvent.show({
      heading: "Email not verified",
      message: "Please verify your email first.",
      context: "global"
    });
    return;
  }
  const currentNote = editor?.note?.current;
  if (currentNote?.id) {
    const note = db.notes?.note(currentNote.id)?.data as NoteType;
    if (note?.locked) {
      ToastEvent.show({
        heading: "Locked notes cannot be published",
        type: "error",
        context: "global"
      });
      return;
    }
    if (editorState().isFocused) {
      editorState().isFocused = true;
    }
    eSendEvent(eOpenPublishNoteDialog, note);
  }
};

const showActionsheet = async (editor: useEditorType) => {
  const currentNote = editor?.note?.current;
  if (currentNote?.id) {
    const note = db.notes?.note(currentNote.id)?.data as NoteType;

    if (editorState().isFocused || editorState().isFocused) {
      editorState().isFocused = true;
    }
    const { Properties } = require("../../../components/properties/index.js");
    Properties.present(note, ["Dark Mode"]);
  } else {
    ToastEvent.show({
      heading: "Start writing to create a new note",
      type: "success",
      context: "global"
    });
  }
};

export const useEditorEvents = (
  editor: useEditorType,
  { readonly: editorPropReadonly, noHeader, noToolbar }: Partial<EditorProps>
) => {
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const fullscreen = useSettingStore((state) => state.fullscreen);
  const corsProxy = useSettingStore((state) => state.settings.corsProxy);
  const loading = useNoteStore((state) => state.loading);
  const [dateFormat, timeFormat] = useSettingStore((state) => [
    state.dateFormat,
    state.timeFormat
  ]);

  const handleBack = useRef<NativeEventSubscription>();
  const readonly = useEditorStore((state) => state.readonly);
  const isPremium = useUserStore((state) => state.premium);
  const doubleSpacedLines = useSettingStore(
    (state) => state.settings?.doubleSpacedLines
  );
  const defaultFontSize = useSettingStore(
    (state) => state.settings.defaultFontSize
  );
  const defaultFontFamily = useSettingStore(
    (state) => state.settings.defaultFontFamily
  );

  const tools = useDragState((state) => state.data);

  useEffect(() => {
    const handleKeyboardDidShow: KeyboardEventListener = () => {
      editor.commands.keyboardShown(true);
      editor.postMessage(EditorEvents.keyboardShown, undefined);
    };
    const handleKeyboardDidHide: KeyboardEventListener = () => {
      editor.commands.keyboardShown(false);
    };
    const subscriptions = [
      Keyboard.addListener("keyboardDidShow", handleKeyboardDidShow),
      Keyboard.addListener("keyboardDidHide", handleKeyboardDidHide)
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [editor.commands, editor.postMessage]);

  useEffect(() => {
    if (loading) return;
    editor.commands.setSettings({
      deviceMode: deviceMode || "mobile",
      fullscreen: fullscreen || false,
      premium: isPremium,
      readonly: readonly || editorPropReadonly,
      tools: tools || getDefaultPresets().default,
      noHeader: noHeader,
      noToolbar: readonly || editorPropReadonly || noToolbar,
      doubleSpacedLines: doubleSpacedLines,
      corsProxy: corsProxy,
      fontSize: defaultFontSize,
      fontFamily: defaultFontFamily,
      dateFormat: db.settings?.getDateFormat(),
      timeFormat: db.settings?.getTimeFormat()
    });
  }, [
    fullscreen,
    isPremium,
    readonly,
    editor.sessionId,
    editor.loading,
    deviceMode,
    tools,
    editor.commands,
    doubleSpacedLines,
    editorPropReadonly,
    noHeader,
    noToolbar,
    corsProxy,
    defaultFontSize,
    defaultFontFamily,
    dateFormat,
    timeFormat,
    loading
  ]);

  const onBackPress = useCallback(async () => {
    const editorHandledBack = await editor.commands.handleBack();
    if (!editorHandledBack) {
      logger.info("editor handled back event", editorHandledBack);
      return;
    }
    setTimeout(async () => {
      if (deviceMode !== "mobile" && fullscreen) {
        if (fullscreen) {
          eSendEvent(eCloseFullscreenEditor);
        }
        return;
      }

      if (deviceMode === "mobile") {
        editorState().movedAway = true;
        tabBarRef.current?.goToPage(0);
      }
      setImmediate(() => {
        useEditorStore.getState().setCurrentlyEditingNote(null);
        setTimeout(() => {
          Navigation.queueRoutesForUpdate();
        }, 500);
      });
      editorState().currentlyEditing = false;
      editor.reset();
    }, 1);
  }, [editor, deviceMode, fullscreen]);

  const onHardwareBackPress = useCallback(() => {
    if (editorState().currentlyEditing) {
      onBackPress();
      return true;
    }
  }, [onBackPress]);

  const onLoadNote = useCallback(async () => {
    InteractionManager.runAfterInteractions(() => {
      if (!DDS.isTab) {
        handleBack.current = BackHandler.addEventListener(
          "hardwareBackPress",
          onHardwareBackPress
        );
      }
    });
  }, [onHardwareBackPress]);

  const onClearEditorSessionRequest = useCallback(
    async (value: string) => {
      if (editorState()?.isAwaitingResult) return;

      if (value === "removeHandler") {
        if (handleBack.current) {
          handleBack.current.remove();
        }
        return;
      }
      if (value === "addHandler") {
        if (handleBack.current) {
          handleBack.current.remove();
        }

        handleBack.current = BackHandler.addEventListener(
          "hardwareBackPress",
          onHardwareBackPress
        );
        return;
      }
      if (editorState().currentlyEditing) {
        await onBackPress();
      }
    },
    [onBackPress, onHardwareBackPress]
  );

  useEffect(() => {
    if (fullscreen && DDS.isTab) {
      handleBack.current = BackHandler.addEventListener(
        "hardwareBackPress",
        onHardwareBackPress
      );
    }

    return () => {
      if (handleBack.current && DDS.isTab) {
        handleBack.current.remove();
      }
    };
  }, [fullscreen, onHardwareBackPress]);

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote + editor.editorId, onLoadNote);
    eSubscribeEvent(
      eClearEditor + editor.editorId,
      onClearEditorSessionRequest
    );
    return () => {
      eUnSubscribeEvent(eClearEditor, onClearEditorSessionRequest);
      eUnSubscribeEvent(eOnLoadNote, onLoadNote);
    };
  }, [editor.editorId, onClearEditorSessionRequest, onLoadNote]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const data = event.nativeEvent.data;
      const editorMessage = JSON.parse(data) as EditorMessage;

      if (editorMessage.type === EventTypes.content) {
        editor.saveContent({
          type: editorMessage.type,
          content: editorMessage.value as string,
          forSessionId: editorMessage.sessionId
        });
      } else if (editorMessage.type === EventTypes.title) {
        editor.saveContent({
          type: editorMessage.type,
          title: editorMessage.value as string,
          forSessionId: editorMessage.sessionId
        });
      }

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
        case EventTypes.contentchange:
          editor.onContentChanged();
          break;
        case EventTypes.selection:
          break;
        case EventTypes.reminders:
          if (!editor.note.current) {
            ToastEvent.show({
              heading: "Create a note first to add a reminder",
              type: "success"
            });
            return;
          }
          RelationsList.present({
            reference: editor.note.current as any,
            referenceType: "reminder",
            relationType: "from",
            title: "Reminders",
            onAdd: () =>
              ReminderSheet.present(undefined, editor.note.current as any, true)
          });
          break;
        case EventTypes.newtag:
          if (!editor.note.current) {
            ToastEvent.show({
              heading: "Create a note first to add a tag",
              type: "success"
            });
            return;
          }
          ManageTagsSheet.present([editor.note.current]);
          break;
        case EventTypes.tag:
          if (editorMessage.value) {
            if (!editor.note.current) return;
            db.notes
              ?.note(editor.note.current?.id)
              .untag(editorMessage.value)
              .then(async () => {
                useTagStore.getState().setTags();
                await editor.commands.setTags(editor.note.current);
                Navigation.queueRoutesForUpdate();
              });
          }
          break;
        case EventTypes.filepicker:
          editorState().isAwaitingResult = true;
          const { pick } = require("./picker.js").default;
          pick({ type: editorMessage.value });
          setTimeout(() => {
            editorState().isAwaitingResult = false;
          }, 1000);
          break;
        case EventTypes.download: {
          const downloadAttachment =
            require("../../../common/filesystem/download-attachment").default;
          downloadAttachment((editorMessage.value as Attachment)?.hash, true);
          break;
        }

        case EventTypes.pro:
          if (editor.state.current?.isFocused) {
            editor.state.current.isFocused = true;
          }
          eSendEvent(eOpenPremiumDialog);
          break;
        case EventTypes.monograph:
          publishNote(editor);
          break;
        case EventTypes.properties:
          showActionsheet(editor);
          break;
        case EventTypes.fullscreen:
          editorState().isFullscreen = true;
          eSendEvent(eOpenFullscreenEditor);
          break;
        case EventTypes.back:
          onBackPress();
          break;
        case EventTypes.link:
          openLinkInBrowser(editorMessage.value as string);
          break;

        case EventTypes.previewAttachment: {
          const hash = (editorMessage.value as Attachment)?.hash;
          const attachment = db.attachments?.attachment(hash);
          if (attachment.metadata.type.startsWith("image/")) {
            eSendEvent("ImagePreview", editorMessage.value);
          } else {
            eSendEvent("PDFPreview", attachment);
          }

          break;
        }

        default:
          break;
      }
      eSendEvent(editorMessage.type, editorMessage);
    },
    [editor, onBackPress]
  );

  return onMessage;
};
