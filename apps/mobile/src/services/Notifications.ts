import { useNoteStore } from './../provider/stores';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';
import PushNotification, { Importance, PushNotificationDeliveredObject } from 'react-native-push-notification';
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
  if (Platform.OS === "ios") return;
  PushNotification.configure({
    onNotification: function (notification) {
      editing.movedAway = false;
      MMKV.removeItem('appState');
      if (useNoteStore?.getState()?.loading === false) {
        //@ts-ignore
        loadNote(notification.tag, false)
        return;
      }

      let unsub = useNoteStore.subscribe((loading) => {
        if (loading === false) {
          //@ts-ignore
          loadNote(notification.tag, true);
          //@ts-ignore
        }
        unsub();
      }, state => state.loading);

    },
    onAction: function (notification) {
      console.log("ACTION: ", notification.id);
      if (notification.action === 'UNPIN') {
        //@ts-ignore
        remove(notification.tag, notification.id);
      }
    },
    popInitialNotification: true,
    //@ts-ignore
    requestPermissions: Platform.OS === 'ios',
  });

  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID, // (required)
      channelName: 'Notesnook', // (required)
      playSound: false, // (optional) default: true
      soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
      importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
      vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
    },
    created => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
  );
}

function remove(tag: string, id: string) {
  console.log(tag, id);
  PushNotification.clearLocalNotification(tag || NOTIFICATION_TAG, parseInt(id));
  get().then(() => {
    eSendEvent("onUpdate", "unpin");
  });
}

function present({ title, message, subtitle, bigText, actions = [], ongoing, tag }: { title: string, message: string, subtitle: string, bigText: string, actions: Array<string>, ongoing: boolean, tag: string }) {

  PushNotification.localNotification({
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
    smallIcon: "ic_stat_name"
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
    if (Platform.OS === "ios") resolve([]);
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
  getPinnedNotes
};
