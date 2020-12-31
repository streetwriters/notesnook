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

//"https://api.notesnook.com"

db.host({
  API_HOST: 'http://192.168.10.10:5264',
  AUTH_HOST: 'http://192.168.10.10:8264',
  SSE_HOST: 'http://192.168.10.10:7264',
});
