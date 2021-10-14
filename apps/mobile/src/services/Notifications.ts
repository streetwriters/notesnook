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

const NOTIFICATION_TAG = 'notesnook';
const CHANNEL_ID = 'com.streetwriters.notesnook';
let pinned = [];

function loadNote(id: string, jump: boolean) {
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
    onNotification: function (notification) {
      editing.movedAway = false;
      MMKV.removeItem('appState');
      if (useNoteStore?.getState()?.loading === false) {
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
        case "Hide":
          //@ts-ignore
          remove(notification.tag, notification.id);
          break
        case "ReplyInput":
          console.log("texto", notification);
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
  console.log(tag, id);
  PushNotification.clearLocalNotification(
    tag || NOTIFICATION_TAG,
    parseInt(id)
  );
  get().then(() => {
    eSendEvent('onUpdate', 'unpin');
  });
}

function pinQuickNote(id: string) {

  present({
    title: 'Quick note',
    message: 'Tap on "Add Note" to take a note here',
    ongoing: true,
    actions: ['ReplyInput', 'Hide'],
    tag: 'notesnook_note_input',
    reply_button_text: 'Take note',
    reply_placeholder_text: 'Write something...',
    id: parseInt(id)
  });
}

async function unpinQuickNote() {
  let all = await get();
  let quicknote = all.find(n => n.tag === "notesnook_note_input")
  if (quicknote) {
    remove(quicknote.tag, quicknote.identifier)
  }
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
