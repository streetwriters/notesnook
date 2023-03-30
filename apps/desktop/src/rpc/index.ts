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

import { ITransport } from "./types";

export const CHANNEL = "RPC_COM_CHANNEL";
type RPCApi = Record<string, (...args: any[]) => any>;
type WrappedAPI<TApi extends RPCApi> = {
  [P in keyof TApi]: (
    ...args: Parameters<TApi[P]>
  ) => ReturnType<TApi[P]> extends void
    ? void
    : ReturnType<TApi[P]> extends Promise<infer T>
    ? Promise<T>
    : Promise<ReturnType<TApi[P]>>;
};

export function createRPCClient<TApi extends RPCApi>(
  transport: ITransport,
  api: TApi
): WrappedAPI<TApi> {
  const wrappedAPI = <WrappedAPI<TApi>>{};
  for (const method in api) {
    if (Object.hasOwn(api, method)) {
      wrappedAPI[<keyof TApi>method] = (...args: any[]) => {
        return <any>new Promise<unknown>((resolve) => {
          transport.receive((message) => {
            if (message.type === "response" && message.id === method) {
              resolve(message.result);
            }
          });

          transport.send({
            type: "message",
            id: method,
            args
          });
        });
      };
    }
  }
  return wrappedAPI;
}

export function createRPCServer<TApi extends RPCApi>(
  transport: ITransport,
  api: TApi
) {
  transport.receive(async (message) => {
    if (
      message.type === "message" &&
      message.id &&
      Object.hasOwn(api, message.id)
    ) {
      const result = await api[<keyof TApi>message.id](...message.args);
      transport.send({ type: "response", id: message.id, result });
    }
  });
}

export * from "./types";
