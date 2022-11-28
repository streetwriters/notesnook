/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import * as Comlink from "comlink";
import { Runtime, browser } from "webextension-polyfill-ts";

const SYMBOL = "__PORT__@";

export type Port = Runtime.Port;
export type OnPortCallback = (port: Port) => void;

export type PortResolver = (id: string, onPort: OnPortCallback) => void;
export type PortDeserializer = (id: string) => MessagePort;

function _resolvePort(id: string, onPort: OnPortCallback) {
  onPort(browser.runtime.connect({ name: id }));
}

function _deserializePort(id: string) {
  const { port1, port2 } = new MessageChannel();
  forward(
    port1,
    browser.runtime.connect({ name: id }),
    _resolvePort,
    _deserializePort
  );
  return port2;
}

export function createEndpoint(
  port: Port,
  resolvePort: PortResolver = _resolvePort,
  deserializePort: PortDeserializer = _deserializePort
): Comlink.Endpoint {
  const listeners = new WeakMap();

  function serialize(data: any): void {
    if (Array.isArray(data)) {
      data.forEach((value, i) => {
        serialize(value);
      });
    } else if (data && typeof data === "object") {
      if (data instanceof MessagePort) {
        const id = SYMBOL + `${+new Date()}${Math.random()}`;
        (data as any)[SYMBOL] = "port";
        (data as any).port = id;
        resolvePort(id, (port) =>
          forward(data, port, resolvePort, deserializePort)
        );
      } else if (data instanceof ArrayBuffer) {
        (data as any)[SYMBOL] =
          data instanceof Uint8Array
            ? "uint8"
            : data instanceof Uint16Array
            ? "uint16"
            : data instanceof Uint32Array
            ? "uint32"
            : "buffer";

        (data as any).blob = URL.createObjectURL(new Blob([data]));
      } else {
        for (const key in data) {
          serialize(data[key]);
        }
      }
    }
  }

  async function deserialize(data: any, ports: any[]): Promise<any> {
    if (Array.isArray(data)) {
      await Promise.all(
        data.map(async (value, i) => {
          data[i] = await deserialize(value, ports);
        })
      );
    } else if (data && typeof data === "object") {
      const type = data[SYMBOL];

      if (type === "port") {
        const port = deserializePort(data.port);
        ports.push(port);
        return port;
      } else if (type) {
        const url = new URL(data.blob);
        if (url.protocol === "blob:") {
          const buffer = await (await fetch(url.href)).arrayBuffer();
          switch (type) {
            case "uint16=":
              return new Uint16Array(buffer);
            case "uint8":
              return new Uint8Array(buffer);
            case "uint32":
              return new Uint32Array(buffer);
            case "buffer":
              return buffer;
          }
        }
      }

      await Promise.all(
        Object.keys(data).map(async (key) => {
          data[key] = await deserialize(data[key], ports);
        })
      );
    }

    return data;
  }

  return {
    postMessage: (message, transfer: MessagePort[]) => {
      serialize(message);
      port.postMessage(message);
    },
    addEventListener: (_, handler) => {
      const listener = async (data: any) => {
        const ports: MessagePort[] = [];
        const event = new MessageEvent("message", {
          data: await deserialize(data, ports),
          ports
        });

        if ("handleEvent" in handler) {
          handler.handleEvent(event);
        } else {
          handler(event);
        }
      };
      port.onMessage.addListener(listener);
      listeners.set(handler, listener);
    },
    removeEventListener: (_, handler) => {
      const listener = listeners.get(handler);
      if (!listener) {
        return;
      }
      port.onMessage.removeListener(listener);
      listeners.delete(handler);
    }
  };
}

export function forward(
  messagePort: MessagePort,
  extensionPort: Port,
  resolvePort: PortResolver = _resolvePort,
  deserializePort: PortDeserializer = _deserializePort
) {
  const port = createEndpoint(extensionPort, resolvePort, deserializePort);

  messagePort.onmessage = ({ data, ports }) => {
    port.postMessage(data, ports as any);
  };

  port.addEventListener("message", ({ data, ports }: any) => {
    messagePort.postMessage(data, ports as any);
  });
}

export function isMessagePort(port: { name: string }) {
  return port.name.startsWith(SYMBOL);
}

const portCallbacks = new Map<string, OnPortCallback[]>();
const ports = new Map<string, Runtime.Port>();

function serializePort(id: string, onPort: OnPortCallback) {
  if (!portCallbacks.has(id)) {
    portCallbacks.set(id, []);
  }
  const callbacks = portCallbacks.get(id)!;
  callbacks.push(onPort);
}

function deserializePort(id: string) {
  const port = ports.get(id)!;
  const { port1, port2 } = new MessageChannel();
  forward(port2, port, serializePort, deserializePort);
  return port1;
}

browser.runtime.onConnect.addListener((port) => {
  if (!isMessagePort(port)) return;
  ports.set(port.name, port);
  portCallbacks.get(port.name)?.forEach((cb) => cb(port));
});

export function createBackgroundEndpoint(port: Runtime.Port) {
  return createEndpoint(port, serializePort, deserializePort);
}
