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
import { immerable, setAutoFreeze } from "immer";
import { create } from "zustand";
import {
  subscribeWithSelector,
  persist,
  PersistOptions
} from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { IStore } from "../stores";
setAutoFreeze(false);

export function createStore<T extends object>(Store: IStore<T>) {
  const store = create<
    T,
    [["zustand/subscribeWithSelector", never], ["zustand/immer", never]]
  >(
    subscribeWithSelector(
      immer((set, get) => {
        const store = new Store(set, get);
        (store as any)[immerable] = true;
        return store;
      })
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
      ["zustand/immer", never]
    ]
  >(
    persist(
      subscribeWithSelector(
        immer((set, get) => {
          const store = new Store(set, get);
          (store as any)[immerable] = true;
          return store;
        })
      ),
      options
    )
  );

  return [store, store.getState()] as const;
}

export default createStore;
