/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Platform } from "react-native";
import PushNotification, {
  Importance,
  PushNotificationDeliveredObject,
  PushNotificationObject
} from "react-native-push-notification";
import { db } from "../common/database";
import { MMKV } from "../common/database/mmkv";
import { eOnLoadNote } from "../utils/events";
import { tabBarRef } from "../utils/global-refs";
import { useNoteStore } from "../stores/use-notes-store";
import { DDS } from "./device-detection";
import { eSendEvent } from "./event-manager";
import SettingsService from "./settings";
import { editorState } from "../screens/editor/tiptap/utils";

const NOTIFICATION_TAG = "notesnook";
const CHANNEL_ID = "com.streetwriters.notesnook";
let pinned: PushNotificationDeliveredObject[] = [];

function loadNote(id: string, jump: boolean) {
  if (!id || id === "notesnook_note_input") return;
  const note = db.notes?.note(id).data;
  if (!DDS.isTab && jump) {
    tabBarRef.current?.goToPage(1);
  }
  eSendEvent("loadingNote", note);
  setTimeout(() => {
    eSendEvent(eOnLoadNote, note);
    if (!jump && !DDS.isTab) {
      tabBarRef.current?.goToPage(1);
    }
  }, 2000);
}

function init() {
  if (Platform.OS === "ios") return;
  PushNotification.configure({
    onNotification: async function (notification) {
      editorState().movedAway = false;
      MMKV.removeItem("appState");
      if (useNoteStore?.getState()?.loading === false) {
        await db.init();
        await db.notes?.init();
        loadNote(
          (notification as unknown as PushNotificationDeliveredObject).tag,
          false
        );
        return;
      }

      const unsub = useNoteStore.subscribe(
        (loading) => {
          if (loading === false) {
            loadNote(
              (notification as unknown as PushNotificationDeliveredObject).tag,
              true
            );
          }
          unsub();
        },
        (state) => state.loading
      );
    },
    onAction: async function (notification) {
      console.log("ACTION: ", notification.action);
      switch (notification.action) {
        case "UNPIN":
          remove(
            (notification as unknown as PushNotificationDeliveredObject).tag,
            notification.id
          );
          break;
        case "Hide":
          unpinQuickNote();
          break;
        case "ReplyInput":
          console.log("texto", notification);
          present({
            title: "Quick note",
            message: 'Tap on "Take note" to add a note.',
            ongoing: true,
            actions: ["ReplyInput", "Hide"],
            tag: "notesnook_note_input",
            reply_button_text: "Take note",
            reply_placeholder_text: "Write something...",
            id: 256266
          });
          await db.init();
          await db.notes?.add({
            content: {
              type: "tiptap",
              data: `<p>${
                (
                  notification as unknown as PushNotificationDeliveredObject & {
                    reply_text: string;
                  }
                ).reply_text
              } </p>`
            }
          });
          await db.notes?.init();
          useNoteStore.getState().setNotes();

          break;
      }
    },
    popInitialNotification: true,
    requestPermissions: false
  });

  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID,
      channelName: "Notesnook",
      playSound: false,
      soundName: "default",
      importance: Importance.HIGH,
      vibrate: true
    },
    (created) => console.log(`createChannel returned '${created}'`)
  );
}

function remove(tag: string, id: string) {
  PushNotification.clearLocalNotification(
    tag || NOTIFICATION_TAG,
    parseInt(id)
  );
  get().then(() => {
    eSendEvent("onUpdate", "unpin");
  });
}

function pinQuickNote(launch: boolean) {
  get().then((items) => {
    const notif = items.filter((i) => i.tag === "notesnook_note_input");
    if (notif && launch) {
      return;
    }
    console.log("showing");
    present({
      title: "Quick note",
      message: 'Tap on "Take note" to add a note.',
      ongoing: true,
      actions: ["ReplyInput", "Hide"],
      tag: "notesnook_note_input",
      reply_button_text: "Take note",
      reply_placeholder_text: "Write something...",
      id: 256266
    });
  });
}

async function unpinQuickNote() {
  remove("notesnook_note_input", 256266 + "");
  SettingsService.set({ notifNotes: false });
}

function present({
  title,
  message,
  subtitle,
  bigText,
  actions = [],
  ongoing,
  tag,
  reply_placeholder_text,
  reply_button_text,
  id
}: {
  title?: string;
  message: string;
  subtitle?: string;
  bigText?: string;
  actions?: Array<string>;
  ongoing?: boolean;
  tag?: string;
  reply_placeholder_text?: string;
  reply_button_text?: string;
  id?: number;
}) {
  PushNotification.localNotification({
    id: id,
    channelId: CHANNEL_ID,
    tag: tag || NOTIFICATION_TAG,
    ongoing: ongoing,
    visibility: "private",
    ignoreInForeground: false,
    actions: actions,
    title: title,
    subText: subtitle,
    bigText: bigText,
    message: message,
    invokeApp: false,
    autoCancel: false,
    smallIcon: "ic_stat_name",
    reply_placeholder_text,
    reply_button_text
  } as PushNotificationObject & {
    reply_placeholder_text: string;
  });
}

function clearAll() {
  PushNotification.cancelAllLocalNotifications();
  PushNotification.clearAllNotifications();
}

function getPinnedNotes(): PushNotificationDeliveredObject[] {
  return pinned;
}

function get(): Promise<PushNotificationDeliveredObject[]> {
  return new Promise((resolve) => {
    if (Platform.OS === "ios") resolve([]);
    PushNotification.getDeliveredNotifications((n) => {
      pinned = n;
      resolve(n);
    });
  });
}

const Notifications = {
  init,
  present,
  clearAll,
  remove,
  get,
  getPinnedNotes,
  pinQuickNote,
  unpinQuickNote
};

export default Notifications;
