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
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.readyState = this.CONNECTING;
    this.connect();
    this.open;
    this.message;
    this.error;
  }

  connect() {
    this.registerEvents();
    NativeEventSource.initRequest(this.url, this.options.headers);
  }

  close() {
    this.readyState = this.CLOSED;
    NativeEventSource.close();
    this.open?.remove();
    this.message?.remove();
    this.error?.remove();
  }

  registerEvents() {
    this.open = EventEmitter.addListener("open", () => {
      this.readyState = this.OPEN;
      this.onopen?.();
    });

    this.message = EventEmitter.addListener("message", (ev) => {
      const { message } = ev;
      const eventData = { data: message };
      this.onmessage(eventData);
    });

    // the native side gave up after a 401/403 instead of retrying
    this.error = EventEmitter.addListener("error", (ev) => {
      this.readyState = this.CLOSED;
      this.onerror?.({ status: ev.status });
    });
  }
}
