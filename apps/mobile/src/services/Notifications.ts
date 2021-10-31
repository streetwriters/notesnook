import { useNoteStore } from './../provider/stores';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import PushNotification, {
  Importance,
  PushNotificationDeliveredObject
} from 'react-native-push-notification';
import { eSendEvent } from './EventManager';
import { db } from '../utils/database';
import { DDS } from './DeviceDetection';
import { tabBarRef } from '../utils/Refs';
import { eOnLoadNote } from '../utils/Events';
import { editing } from '../utils';
import { MMKV } from '../utils/mmkv';
import SettingsService from './SettingsService';

const NOTIFICATION_TAG = 'notesnook';
const CHANNEL_ID = 'com.streetwriters.notesnook';
let pinned = [];

function loadNote(id: string, jump: boolean) {
  if (!id || id === 'notesnook_note_input') return;
  let note = db.notes.note(id).data;
  if (!DDS.isTab && jump) {
    tabBarRef.current?.goToPage(1);
  }
  eSendEvent('loadingNote', note);
  setTimeout(() => {
    eSendEvent(eOnLoadNote, note);
    if (!jump && !DDS.isTab) {
      tabBarRef.current?.goToPage(1);
    }
  }, 2000);
}

function init() {
  if (Platform.OS === 'ios') return;
  PushNotification.configure({
    onNotification: async function (notification) {
      editing.movedAway = false;
      MMKV.removeItem('appState');
      if (useNoteStore?.getState()?.loading === false) {
        //@ts-ignore
        await db.init();
        //@ts-ignore
        await db.notes.init();
        //@ts-ignore
        loadNote(notification.tag, false);
        return;
      }

      let unsub = useNoteStore.subscribe(
        loading => {
          if (loading === false) {
            //@ts-ignore
            loadNote(notification.tag, true);
          }
          unsub();
        },
        state => state.loading
      );
    },
    onAction: async function (notification) {
      console.log('ACTION: ', notification.action);
      switch (notification.action) {
        case "UNPIN":
          //@ts-ignore
          remove(notification.tag, notification.id);
        case "Hide":
          unpinQuickNote();
          break
        case "ReplyInput":
          console.log("texto", notification);
          await db.init();
          await db.notes.add({
            content: {
              type: 'tiny',
              //@ts-ignore
              data: `<p>${notification.reply_text} </p>`
            }
          })
          //@ts-ignore
          await db.notes.init();
          useNoteStore.getState().setNotes();
          //@ts-ignore/////
          pinQuickNote(notification.id);
          break
      }
    },
    popInitialNotification: true,
    //@ts-ignore
    requestPermissions: Platform.OS === 'ios'
  });

  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID,
      channelName: 'Notesnook',
      playSound: false,
      soundName: 'default',
      importance: Importance.HIGH,
      vibrate: true
    },
    created => console.log(`createChannel returned '${created}'`)
  );
}

function remove(tag: string, id: string) {
  PushNotification.clearLocalNotification(
    tag || NOTIFICATION_TAG,
    parseInt(id)
  );
  get().then(() => {
    eSendEvent('onUpdate', 'unpin');
  });
}

function pinQuickNote(launch) {
  present({
    title: 'Quick note',
    message: 'Tap on "Take note" to add a note.',
    ongoing: true,
    actions: ['ReplyInput', 'Hide'],
    tag: 'notesnook_note_input',
    reply_button_text: 'Take note',
    reply_placeholder_text: 'Write something...',
    id: 256266
  });

}

async function unpinQuickNote() {
  remove("notesnook_note_input", 256266 + "");
  SettingsService.set("notifNotes", false);
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
  id?: number
}) {
  PushNotification.localNotification({
    id: id,
    channelId: CHANNEL_ID,
    tag: tag || NOTIFICATION_TAG,
    ongoing: ongoing,
    visibility: 'private',
    ignoreInForeground: false,
    actions: actions,
    title: title,
    subText: subtitle,
    bigText: bigText,
    message: message,
    invokeApp: false,
    autoCancel: false,
    smallIcon: 'ic_stat_name',
    //@ts-ignore
    reply_placeholder_text,
    reply_button_text
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
  return new Promise(resolve => {
    if (Platform.OS === 'ios') resolve([]);
    PushNotification.getDeliveredNotifications(n => {
      pinned = n;
      resolve(n);
    });
  });
}

export default {
  init,
  present,
  clearAll,
  remove,
  get,
  getPinnedNotes,
  pinQuickNote, unpinQuickNote
};
