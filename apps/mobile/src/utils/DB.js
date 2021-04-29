import {Platform} from 'react-native';
import Storage from './storage';
import EventSource from 'rn-eventsource';
import AndroidEventSource from './event-source';
import Database from 'notes-core/api/index';

global.Buffer = require('buffer').Buffer;
export const db = new Database(
  Storage,
  Platform.OS === 'ios' ? EventSource : AndroidEventSource,
);
/**
 *   API_HOST: 'http://192.168.10.6:5264',
  AUTH_HOST: 'http://192.168.10.6:8264',
  SSE_HOST: 'http://192.168.10.6:7264',
 */

db.host( __DEV__ ? {
  API_HOST: 'https://api.notesnook.com',
  AUTH_HOST: 'https://auth.streetwriters.co',
  SSE_HOST: 'https://events.streetwriters.co',
} : {
  API_HOST: 'https://api.notesnook.com',
  AUTH_HOST: 'https://auth.streetwriters.co',
  SSE_HOST: 'https://events.streetwriters.co',
});
