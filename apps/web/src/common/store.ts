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

import { create } from "zustand";
import {
  subscribeWithSelector,
  persist,
  PersistOptions
} from "zustand/middleware";
import { GetState, IStore, SetState } from "../stores";
import { mutative } from "zustand-mutative";

export function createStore<T>(
  getStore: (set: SetState<T>, get: GetState<T>) => T
) {
  const store = create<
    T,
    [["zustand/subscribeWithSelector", never], ["zustand/mutative", never]]
  >(
    subscribeWithSelector(
      mutative(
        (set, get) => {
          const store = getStore(set, get);
          return store;
        },
        {
          strict: import.meta.env.DEV,
          mark: (target, { mutable, immutable }) => {
            if (!target || typeof target !== "object") return mutable;
            return immutable;
          }
        }
      )
    )
  );
  return [store, store.getState()] as const;
}

export function createPersistedStore<T extends object>(
  Store: IStore<T>,
  options: PersistOptions<T, Partial<T>>
) {
  const store = create<
    T,
    [
      ["zustand/persist", Partial<T>],
      ["zustand/subscribeWithSelector", never],
      ["zustand/mutative", never]
    ]
  >(
    persist(
      subscribeWithSelector(
        mutative(
          (set, get) => {
            const store = new Store(set, get);
            return store;
          },
          {
            strict: import.meta.env.DEV,
            mark: (target, { mutable, immutable }) => {
              if (!target || typeof target !== "object") return mutable;
              return immutable;
            }
          }
        )
      ),
      options
    )
  );

  return store;
}

export default createStore;
