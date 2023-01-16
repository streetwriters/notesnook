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

import Database from "@notesnook/core/api/index";
import { initalize, logger as dbLogger } from "@notesnook/core/logger";
import { Platform } from "react-native";
import { MMKVLoader } from "react-native-mmkv-storage";
import filesystem from "../filesystem";
import EventSource from "../../utils/sse/even-source-ios";
import AndroidEventSource from "../../utils/sse/event-source";
import Storage, { KV } from "./storage";
import * as Gzip from "react-native-gzip";

const LoggerStorage = new MMKVLoader()
  .withInstanceID("notesnook_logs")
  .initialize();
initalize(new KV(LoggerStorage), true);
export const DatabaseLogger = dbLogger;

/**
 * @type {import("@notesnook/core/api/index").default}
 */
export var db = new Database(
  Storage,
  Platform.OS === "ios" ? EventSource : AndroidEventSource,
  filesystem,
  {
    compress: Gzip.deflate,
    decompress: Gzip.inflate
  }
);

db.host(
  __DEV__
    ? {
        API_HOST: "https://api.notesnook.com",
        AUTH_HOST: "https://auth.streetwriters.co",
        SSE_HOST: "https://events.streetwriters.co",
        SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
        ISSUES_HOST: "https://issues.streetwriters.co"
        // API_HOST: "http://192.168.8.101:5264",
        // AUTH_HOST: "http://192.168.8.101:8264",
        // SSE_HOST: "http://192.168.8.101:7264",
        // SUBSCRIPTIONS_HOST: "http://192.168.8.101:9264",
        // ISSUES_HOST: "http://192.168.8.101:2624"
      }
    : {
        API_HOST: "https://api.notesnook.com",
        AUTH_HOST: "https://auth.streetwriters.co",
        SSE_HOST: "https://events.streetwriters.co",
        SUBSCRIPTIONS_HOST: "https://subscriptions.streetwriters.co",
        ISSUES_HOST: "https://issues.streetwriters.co"
      }
);

export async function loadDatabase() {
  // if (!DB) {
  //   let module = await import(/* webpackChunkName: "notes-core" */ 'notes-core/api/index');
  //   DB = module.default;
  // }
  // db = new DB(Storage, Platform.OS === 'ios' ? EventSource : AndroidEventSource, filesystem);
  // if (DOMParser) {
  //   await DOMParser.prepare();
  // }
}
