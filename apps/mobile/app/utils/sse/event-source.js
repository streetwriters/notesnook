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

import { NativeEventEmitter, NativeModules, Platform } from "react-native";

const NativeEventSource =
  Platform.OS === "ios" ? null : NativeModules.EventSource;
const EventEmitter =
  Platform.OS === "ios" ? null : new NativeEventEmitter(NativeEventSource);

export default class EventSource {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.connect();
    this.open;
    this.message;
  }

  connect() {
    this.registerEvents();
    NativeEventSource.initRequest(this.url, this.options.headers);
  }

  close() {
    NativeEventSource.close();
    this.open?.remove();
    this.message?.remove();
  }

  registerEvents() {
    this.open = EventEmitter.addListener("open", () => {
      this.onopen();
    });

    this.message = EventEmitter.addListener("message", (ev) => {
      const { message } = ev;
      const eventData = { data: message };
      this.onmessage(eventData);
    });
  }
}
