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
import { ItemReference } from "@notesnook/core";
import type { Attachment } from "@notesnook/editor";
import { getDefaultPresets } from "@notesnook/editor/dist/toolbar/tool-definitions";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useCallback, useEffect, useRef } from "react";
import {
  BackHandler,
  Keyboard,
  KeyboardEventListener,
  NativeEventSubscription,
  useWindowDimensions
} from "react-native";
import { WebViewMessageEvent } from "react-native-webview";
import { DatabaseLogger, db } from "../../../common/database";
import downloadAttachment from "../../../common/filesystem/download-attachment";
import EditorTabs from "../../../components/sheets/editor-tabs";
import { Issue } from "../../../components/sheets/github/issue";
import LinkNote from "../../../components/sheets/link-note";
import ManageTagsSheet from "../../../components/sheets/manage-tags";
import { RelationsList } from "../../../components/sheets/relations-list";
import ReminderSheet from "../../../components/sheets/reminder";
import TableOfContents from "../../../components/sheets/toc";
import { DDS } from "../../../services/device-detection";
import {
  ToastManager,
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  presentSheet
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import SettingsService from "../../../services/settings";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useTagStore } from "../../../stores/use-tag-store";
import { useUserStore } from "../../../stores/use-user-store";
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eEditorTabFocused,
  eOnEnterEditor,
  eOnExitEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenLoginDialog,
  eOpenPremiumDialog,
  eOpenPublishNoteDialog,
  eUnlockWithBiometrics,
  eUnlockWithPassword
} from "../../../utils/events";
import { openLinkInBrowser } from "../../../utils/functions";
import { tabBarRef } from "../../../utils/global-refs";
import { useDragState } from "../../settings/editor/state";
import { EventTypes } from "./editor-events";
import { EditorMessage, EditorProps, useEditorType } from "./types";
import { useTabStore } from "./use-tab-store";
import { EditorEvents, editorState, openInternalLink } from "./utils";
import { strings } from "@notesnook/intl";

const publishNote = async () => {
  const user = useUserStore.getState().user;
  if (!user) {
    ToastManager.show({
      heading: strings.loginRequired(),
      context: "global",
      func: () => {
        eSendEvent(eOpenLoginDialog);
      },
      actionText: "Login"
    });
    return;
  }

  if (!user?.isEmailConfirmed) {
    ToastManager.show({
      heading: strings.emailNotConfirmed(),
      context: "global"
    });
    return;
  }
  const noteId = useTabStore
    .getState()
    .getNoteIdForTab(useTabStore.getState().currentTab);

  if (noteId) {
    const note = await db.notes?.note(noteId);
    const locked = note && (await db.vaults.itemExists(note));
    if (locked) {
      ToastManager.show({
        heading: strings.lockedNotesPublishFailed(),
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

const showActionsheet = async () => {
  const noteId = useTabStore
    .getState()
    .getNoteIdForTab(useTabStore.getState().currentTab);
  if (noteId) {
    const note = await db.notes?.note(noteId);
    if (editorState().isFocused || editorState().isFocused) {
      editorState().isFocused = true;
    }
    const { Properties } = require("../../../components/properties/index.js");
    Properties.present(note, ["Dark Mode"]);
  } else {
    ToastManager.show({
      heading: strings.noNoteProperties(),
      type: "success",
      context: "global"
    });
  }
};

type ContentMessage = { html: string; ignoreEdit: boolean };

export const useEditorEvents = (
  editor: useEditorType,
  { readonly: editorPropReadonly, noHeader, noToolbar }: Partial<EditorProps>
) => {
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const fullscreen = useSettingStore((state) => state.fullscreen);
  const corsProxy = useSettingStore((state) => state.settings.corsProxy);
  const loading = useSettingStore((state) => state.isAppLoading);
  const [dateFormat, timeFormat] = useSettingStore((state) => [
    state.dateFormat,
    state.timeFormat
  ]);
  const handleBack = useRef<NativeEventSubscription>();
  const isPremium = useUserStore((state) => state.premium);
  const { fontScale } = useWindowDimensions();

  const doubleSpacedLines = useSettingStore(
    (state) => state.settings?.doubleSpacedLines
  );
  const defaultFontSize = useSettingStore(
    (state) => state.settings.defaultFontSize
  );
  const defaultFontFamily = useSettingStore(
    (state) => state.settings.defaultFontFamily
  );
  const markdownShortcuts = useSettingStore(
    (state) => state.settings.markdownShortcuts
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
    if (typeof defaultFontFamily === "object") {
      SettingsService.set({
        defaultFontFamily: (defaultFontFamily as any).id
      });
    }

    editor.commands.setSettings({
      deviceMode: deviceMode || "mobile",
      fullscreen: fullscreen || false,
      premium: isPremium,
      readonly: false,
      tools: tools || getDefaultPresets().default,
      noHeader: noHeader,
      noToolbar: noToolbar,
      doubleSpacedLines: doubleSpacedLines,
      corsProxy: corsProxy,
      fontSize:
        typeof defaultFontSize === "string"
          ? parseInt(defaultFontSize)
          : defaultFontSize,
      fontFamily: SettingsService.get().defaultFontFamily,
      dateFormat: db.settings?.getDateFormat(),
      timeFormat: db.settings?.getTimeFormat(),
      fontScale,
      markdownShortcuts
    });
  }, [
    fullscreen,
    isPremium,
    editor.loading,
    deviceMode,
    tools,
    editor.commands,
    doubleSpacedLines,
    noHeader,
    noToolbar,
    corsProxy,
    defaultFontSize,
    defaultFontFamily,
    dateFormat,
    timeFormat,
    loading,
    fontScale,
    markdownShortcuts
  ]);

  const onBackPress = useCallback(async () => {
    const editorHandledBack = await editor.commands.handleBack();
    if (!editorHandledBack) {
      logger.info("editor handled back event", editorHandledBack);
      return;
    }
    editorState().currentlyEditing = false;
    // editor.reset(); Notes remain open.
    editor.commands?.blur(useTabStore.getState().currentTab);
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

      setTimeout(() => {
        Navigation.queueRoutesForUpdate();
      }, 500);
    }, 1);
  }, [editor, deviceMode, fullscreen]);

  const onHardwareBackPress = useCallback(() => {
    console.log(tabBarRef.current?.page());
    if (tabBarRef.current?.page() === 2) {
      onBackPress();
      return true;
    }
  }, [onBackPress]);

  const onEnterEditor = useCallback(async () => {
    if (!DDS.isTab) {
      handleBack.current = BackHandler.addEventListener(
        "hardwareBackPress",
        onHardwareBackPress
      );
    }
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
    const onExitEditor = () => {
      if (handleBack.current) {
        handleBack.current.remove();
      }
    };

    eSubscribeEvent(eOnEnterEditor, onEnterEditor);
    eSubscribeEvent(eOnExitEditor, onExitEditor);
    eSubscribeEvent(
      eClearEditor + editor.editorId,
      onClearEditorSessionRequest
    );
    return () => {
      eUnSubscribeEvent(eClearEditor, onClearEditorSessionRequest);
      eUnSubscribeEvent(eOnEnterEditor, onEnterEditor);
      eUnSubscribeEvent(eOnExitEditor, onExitEditor);
    };
  }, [editor.editorId, onClearEditorSessionRequest, onEnterEditor]);

  const onMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      const data = event.nativeEvent.data;
      const editorMessage = JSON.parse(data) as EditorMessage<any>;

      if (editorMessage.hasTimeout && editorMessage.resolverId) {
        editor.postMessage(EditorEvents.resolve, {
          data: true,
          resolverId: editorMessage.resolverId
        });
      }

      if (editorMessage.type === EventTypes.load) {
        DatabaseLogger.log("Editor is ready");
        editor.onLoad();
        return;
      }

      if (editorMessage.type === EventTypes.back) {
        return onBackPress();
      }

      if (
        editorMessage.sessionId !== editor.sessionId.current &&
        editorMessage.type !== EditorEvents.status
      ) {
        return;
      }

      const noteId = useTabStore
        .getState()
        .getNoteIdForTab(editorMessage.tabId);

      switch (editorMessage.type) {
        case EventTypes.content:
          DatabaseLogger.log("EventTypes.content");
          editor.saveContent({
            type: editorMessage.type,
            content: editorMessage.value.html as string,
            noteId: noteId,
            tabId: editorMessage.tabId,
            ignoreEdit: (editorMessage.value as ContentMessage).ignoreEdit,
            pendingChanges: editorMessage.value?.pendingChanges
          });
          break;
        case EventTypes.title:
          DatabaseLogger.log("EventTypes.title");
          editor.saveContent({
            type: editorMessage.type,
            title: editorMessage.value?.title as string,
            noteId: noteId,
            tabId: editorMessage.tabId,
            ignoreEdit: false,
            pendingChanges: editorMessage.value?.pendingChanges
          });
          break;
        case EventTypes.logger:
          logger.info("[EDITOR LOG]", editorMessage.value);
          break;
        case EventTypes.dbLogger:
          if (editorMessage.value.error) {
            DatabaseLogger.error(
              editorMessage.value.error,
              editorMessage.value.error,
              {
                message: "[EDITOR_ERROR]" + editorMessage.value.message
              }
            );
          } else {
            DatabaseLogger.info("[EDITOR_LOG]" + editorMessage.value.message);
          }
          break;
        case EventTypes.contentchange:
          editor.onContentChanged(editorMessage.noteId);
          break;
        case EventTypes.selection:
          break;
        case EventTypes.reminders:
          if (!noteId) {
            ToastManager.show({
              heading: strings.createNoteFirst(),
              type: "success"
            });
            return;
          }
          const note = await db.notes.note(noteId);
          if (!note) return;
          RelationsList.present({
            reference: note as any,
            referenceType: "reminder",
            relationType: "from",
            title: strings.dataTypesPluralCamelCase.reminder(),
            onAdd: () => ReminderSheet.present(undefined, note, true)
          });
          break;
        case EventTypes.newtag:
          if (!noteId) {
            ToastManager.show({
              heading: strings.createNoteFirst(),
              type: "success"
            });
            return;
          }
          ManageTagsSheet.present([noteId]);
          break;
        case EventTypes.tag:
          if (editorMessage.value) {
            if (!noteId) return;
            const note = await db.notes.note(noteId);
            if (!note) return;

            db.relations
              .unlink(editorMessage.value as ItemReference, note)
              .then(async () => {
                useTagStore.getState().refresh();
                useRelationStore.getState().update();
                await editor.commands.setTags(note);
                Navigation.queueRoutesForUpdate();
              });
          }
          break;
        case EventTypes.filepicker:
          editorState().isAwaitingResult = true;
          const { pick } = require("./picker").default;
          pick({
            type: editorMessage.value,
            noteId: noteId,
            tabId: editorMessage.tabId
          });
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

        case EventTypes.getAttachmentData: {
          const attachment = (editorMessage.value as any)
            ?.attachment as Attachment;

          DatabaseLogger.log(
            `Getting attachment data: ${attachment?.hash} ${attachment?.type}`
          );
          downloadAttachment(attachment.hash, true, {
            base64: attachment.type === "image",
            text: attachment.type === "web-clip",
            silent: true,
            groupId: editor.note.current?.id,
            cache: true
          } as any)
            .then((data: any) => {
              console.log(
                "Got attachment data:",
                !!data,
                editorMessage.resolverId
              );
              editor.postMessage(EditorEvents.resolve, {
                resolverId: editorMessage.resolverId,
                data
              });
            })
            .catch((e) => {
              DatabaseLogger.error(e);
              editor.postMessage(EditorEvents.resolve, {
                resolverId: editorMessage.resolverId,
                data: undefined
              });
            });

          break;
        }

        case EventTypes.pro:
          if (editor.state.current?.isFocused) {
            editor.state.current.isFocused = true;
          }
          eSendEvent(eOpenPremiumDialog);
          break;
        case EventTypes.monograph:
          publishNote();
          break;
        case EventTypes.properties:
          showActionsheet();
          break;
        case EventTypes.scroll:
          editorState().scrollPosition = editorMessage.value;
          break;
        case EventTypes.fullscreen:
          editorState().isFullscreen = true;
          eSendEvent(eOpenFullscreenEditor);
          break;
        case EventTypes.link:
          if (editorMessage.value.startsWith("nn://")) {
            openInternalLink(editorMessage.value);
            console.log(
              "Opening note from internal link:",
              editorMessage.value
            );
          } else {
            openLinkInBrowser(editorMessage.value as string);
          }
          break;

        case EventTypes.previewAttachment: {
          const hash = (editorMessage.value as Attachment)?.hash;
          const attachment = await db.attachments?.attachment(hash);
          if (!attachment) return;
          if (attachment.mimeType.startsWith("image/")) {
            eSendEvent("ImagePreview", editorMessage.value);
          } else {
            eSendEvent("PDFPreview", attachment);
          }
          break;
        }
        case EventTypes.copyToClipboard: {
          Clipboard.setString(editorMessage.value as string);
          break;
        }
        case EventTypes.tabsChanged: {
          // useTabStore.setState({
          //   tabs: (editorMessage.value as any)?.tabs,
          //   currentTab: (editorMessage.value as any)?.currentTab
          // });
          // console.log("Tabs updated");
          break;
        }
        case EventTypes.toc:
          TableOfContents.present(editorMessage.value);
          break;
        case EventTypes.showTabs: {
          EditorTabs.present();
          break;
        }
        case EventTypes.error: {
          presentSheet({
            component: (
              <Issue
                defaultBody={editorMessage.value.stack}
                defaultTitle={editorMessage.value.message}
                issueTitle={editorMessage.value.message}
              />
            )
          });
          break;
        }
        case EventTypes.tabFocused: {
          console.log(
            "Focused tab",
            editorMessage.tabId,
            editorMessage.noteId,
            "Content:",
            editorMessage.value
          );

          eSendEvent(eEditorTabFocused, editorMessage.tabId);

          if (
            (!editorMessage.value || editor.currentLoadingNoteId.current) &&
            editorMessage.noteId
          ) {
            if (!useSettingStore.getState().isAppLoading) {
              const note = await db.notes.note(editorMessage.noteId);
              if (note) {
                eSendEvent(eOnLoadNote, {
                  item: note,
                  forced: true,
                  tabId: editorMessage.tabId
                });
              }
            } else {
              const unsub = useSettingStore.subscribe(async (state) => {
                if (!state.isAppLoading) {
                  unsub();
                  const note = await db.notes.note(editorMessage.noteId);
                  if (note) {
                    eSendEvent(eOnLoadNote, {
                      item: note,
                      forced: true,
                      tabId: editorMessage.tabId
                    });
                  }
                }
              });
            }
          }

          break;
        }
        case EventTypes.createInternalLink: {
          LinkNote.present(
            editorMessage.value.attributes,
            editorMessage.resolverId as string
          );
          break;
        }

        case EventTypes.unlock: {
          eSendEvent(eUnlockWithPassword, editorMessage.value);
          break;
        }

        case EventTypes.unlockWithBiometrics: {
          eSendEvent(eUnlockWithBiometrics);
          break;
        }

        case EventTypes.disableReadonlyMode: {
          const noteId = editorMessage.value;
          if (noteId) {
            await db.notes.readonly(false, noteId);
            editor.note.current[noteId] = await db.notes?.note(noteId);
            useTabStore
              .getState()
              .updateTab(useTabStore.getState().currentTab, {
                readonly: false
              });
            setTimeout(() => {
              Navigation.queueRoutesForUpdate();
            });
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
