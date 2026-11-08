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
/* eslint-disable no-var */

/// <reference lib="webworker" />

export default null;

declare var self: SharedWorkerGlobalScope & typeof globalThis;
const mapClientIdToPort: Map<string, MessagePort> = new Map();

self.addEventListener("connect", (event) => {
  console.log("connected", event);
  // The first message from a client associates the clientId with the port.
  const workerPort = event.ports[0];
  workerPort.addEventListener(
    "message",
    (event) => {
      console.log("received message", event.data);
      mapClientIdToPort.set(event.data.clientId, workerPort);

      // Remove the entry when the client goes away, which we detect when
      // the lock on its name becomes available.
      navigator.locks.request(event.data.clientId, { mode: "shared" }, () => {
        mapClientIdToPort.get(event.data.clientId)?.close();
        mapClientIdToPort.delete(event.data.clientId);
      });

      // Subsequent messages will be forwarded.
      workerPort.addEventListener("message", (event) => {
        const port = mapClientIdToPort.get(event.data.clientId);
        console.log("sending message to client", event.data.clientId, port);
        port?.postMessage(event.data, [...event.ports]);
      });
    },
    { once: true }
  );
  workerPort.start();
});
