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


db.host({
  API_HOST: 'https://api.notesnook.com',
  AUTH_HOST: 'https://auth.streetwriters.co',
  SSE_HOST: 'https://events.streetwriters.co',
});
