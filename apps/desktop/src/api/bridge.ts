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

import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import TypedEventEmitter from "typed-emitter";

export type AppEvents = {
  onCreateItem(name: "note" | "notebook" | "reminder"): void;
};

const emitter = new EventEmitter();
const typedEmitter = emitter as TypedEventEmitter<AppEvents>;
const t = initTRPC.create();

export const bridgeRouter = t.router({
  onCreateItem: createSubscription("onCreateItem")
});

export const bridge: AppEvents = new Proxy({} as AppEvents, {
  get(_t, name) {
    if (typeof name === "symbol") return;
    return (...args: unknown[]) => {
      emitter.emit(name, ...args);
    };
  }
});

function createSubscription<TName extends keyof AppEvents>(eventName: TName) {
  return t.procedure.subscription(() => {
    return observable<Parameters<AppEvents[TName]>[0]>((emit) => {
      const listener: AppEvents[TName] = (...args: any[]) => {
        emit.next(args[0]);
      };
      typedEmitter.addListener(eventName, listener);
      return () => {
        typedEmitter.removeListener(eventName, listener);
      };
    });
  });
}
