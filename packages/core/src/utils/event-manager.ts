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

export type EventManagerSubscription = {
  unsubscribe: () => boolean;
};

export type EventHandler = (...args: any[]) => any;

export type EventProperties = {
  once?: boolean;
};

export class EventManager {
  public _registry: Map<string, Map<EventHandler, EventProperties>>;
  constructor() {
    this._registry = new Map();
  }

  unsubscribeAll() {
    this._registry.clear();
  }

  subscribeMulti(names: string[], handler: EventHandler, thisArg: any) {
    return names.map((name) => this.subscribe(name, handler.bind(thisArg)));
  }

  subscribe(name: string, handler: EventHandler, once = false) {
    if (!name || !handler) throw new Error("name and handler are required.");
    this.handlers(name).set(handler, { once });
    return { unsubscribe: () => this.unsubscribe(name, handler) };
  }

  subscribeSingle(name: string, handler: EventHandler) {
    if (!name || !handler) throw new Error("name and handler are required.");
    this.handlers(name).clear();
    this.handlers(name).set(handler, { once: false });
    return { unsubscribe: () => this.unsubscribe(name, handler) };
  }

  unsubscribe(name: string, handler: EventHandler) {
    return !!this._registry.get(name)?.delete(handler);
  }

  publish(name: string, ...args: any[]) {
    const handlers = this._registry.get(name);
    if (!handlers) return;
    for (const [handler, props] of Array.from(handlers)) {
      // skip handlers unsubscribed by an earlier handler
      if (!handlers.has(handler)) continue;
      if (props.once) handlers.delete(handler);
      try {
        const result = handler(...args);
        if (result instanceof Promise)
          result.catch((e) => onHandlerError(name, e));
      } catch (e) {
        onHandlerError(name, e);
      }
    }
  }

  async publishWithResult<T = unknown>(
    name: string,
    ...args: any[]
  ): Promise<T[] | boolean> {
    const handlers: EventHandler[] = [];
    this._registry.get(name)?.forEach((props, handler, map) => {
      handlers.push(handler);
      if (props.once) map.delete(handler);
    });

    if (handlers.length <= 0) return true;
    return await Promise.all(handlers.map((handler) => handler(...args)));
  }

  remove(...names: string[]) {
    for (const name of names) this._registry.delete(name);
  }

  private handlers(name: string) {
    let handlers = this._registry.get(name);
    if (!handlers) {
      handlers = new Map();
      this._registry.set(name, handlers);
    }
    return handlers;
  }
}

function onHandlerError(name: string, error: unknown) {
  console.error(`Error in "${name}" event handler.`, error);
}
export default EventManager;
