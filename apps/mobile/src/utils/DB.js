import {Platform} from "react-native";
import Storage from "./Storage";
import EventSource from "rn-eventsource";
import AndroidEventSource from "./EventSource";
import Database from "notes-core/api/index";

global.Buffer = require('buffer').Buffer;
export const db = new Database(
    Storage,
    Platform.OS === 'ios' ? EventSource : AndroidEventSource,
);
db.host("https://api.notesnook.com")
