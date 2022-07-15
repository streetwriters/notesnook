import { Platform } from 'react-native';
import filesystem from '../filesystem';
import EventSource from '../sse/even-source-ios';
import AndroidEventSource from '../sse/event-source';
import Storage from './storage';
import Database from '@streetwriters/notesnook-core/api/index';

/**
 * @type {import("@streetwriters/notesnook-core/api/index").default}
 */
export var db = new Database(
  Storage,
  Platform.OS === 'ios' ? EventSource : AndroidEventSource,
  filesystem
);

db.host(
  __DEV__
    ? {
        API_HOST: 'https://api.notesnook.com',
        AUTH_HOST: 'https://auth.streetwriters.co',
        SSE_HOST: 'https://events.streetwriters.co',
        SUBSCRIPTIONS_HOST: 'https://subscriptions.streetwriters.co',
        ISSUES_HOST: 'https://issues.streetwriters.co'
        // API_HOST: 'http://192.168.10.29:5264',
        // AUTH_HOST: 'http://192.168.10.29:8264',
        // SSE_HOST: 'http://192.168.10.29:7264',
        // SUBSCRIPTIONS_HOST: 'http://192.168.10.29:9264',
        // ISSUES_HOST: 'http://192.168.10.29:2624'
      }
    : {
        API_HOST: 'https://api.notesnook.com',
        AUTH_HOST: 'https://auth.streetwriters.co',
        SSE_HOST: 'https://events.streetwriters.co',
        SUBSCRIPTIONS_HOST: 'https://subscriptions.streetwriters.co',
        ISSUES_HOST: 'https://issues.streetwriters.co'
      }
);

export async function loadDatabase() {
  // if (!DB) {
  //   let module = await import(/* webpackChunkName: "notes-core" */ 'notes-core/api/index');
  //   DB = module.default;
  // }
  // db = new DB(Storage, Platform.OS === 'ios' ? EventSource : AndroidEventSource, filesystem);
  // //@ts-ignore
  // if (DOMParser) {
  //   //@ts-ignore
  //   await DOMParser.prepare();
  // }
}
