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

type EventMap = {
  [key: string]: unknown;
};

type EventReference<T extends EventMap> = {
  name: keyof T;
  once: boolean;
};

type EventResult = { result: boolean };

type EventHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload
) => TResult;

type SubscribeResult = { unsubscribe: () => boolean };

export class EventManager<TEventMap extends EventMap> {
  #registry: Map<EventHandler, EventReference<TEventMap>> = new Map<
    EventHandler,
    EventReference<TEventMap>
  >();

  unsubscribeAll() {
    this.#registry.clear();
  }

  subscribe<T extends keyof TEventMap>(
    name: T,
    handler: EventHandler<TEventMap[T], Promise<void> | void>,
    once = false
  ): SubscribeResult {
    if (!name || !handler) throw new Error("name and handler are required.");
    this.#registry.set(<EventHandler>handler, { name, once });
    return { unsubscribe: () => this.unsubscribe(handler) };
  }

  unsubscribe<T extends keyof TEventMap>(handler: EventHandler<TEventMap[T]>) {
    return this.#registry.delete(<EventHandler>handler);
  }

  publish<T extends keyof TEventMap>(name: T, payload: TEventMap[T]) {
    this.#registry.forEach((props, handler) => {
      if (props.name === name) handler(payload);
      if (props.once) this.#registry.delete(handler);
    });
  }

  async publishWithResult<T extends keyof TEventMap>(
    name: T,
    payload: TEventMap[T]
  ): Promise<EventResult[]> {
    const handlers: EventHandler[] = [];
    this.#registry.forEach((props, handler) => {
      if (props.name === name) handlers.push(handler);
      if (props.once) this.#registry.delete(handler);
    });

    if (handlers.length <= 0) return [];

    return await Promise.all(
      handlers.map(async (handler) => {
        const result = await handler(payload);
        return isEventResult(result) ? result : { result: false };
      })
    );
  }

  remove<T extends keyof TEventMap>(...names: T[]) {
    this.#registry.forEach((props, handler) => {
      if (names.includes(<T>props.name)) this.#registry.delete(handler);
    });
  }
}

function isEventResult(result: unknown): result is EventResult {
  return typeof result === "object" && !!result && "result" in result;
}
