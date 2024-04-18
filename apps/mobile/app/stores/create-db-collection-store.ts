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

import { Item, VirtualizedGrouping } from "@notesnook/core";
import create, { State, StoreApi, UseBoundStore } from "zustand";
import { resolveItems } from "@notesnook/common";
import { useSettingStore } from "./use-setting-store";
import { DatabaseLogger } from "../common/database";
import { ToastManager } from "../services/event-manager";

export interface DBCollectionStore<Type extends Item> extends State {
  items: VirtualizedGrouping<Type> | undefined;
  loading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
}

const ALL_STORES: UseBoundStore<
  DBCollectionStore<Item>,
  StoreApi<DBCollectionStore<Item>>
>[] = [];

export function clearAllStores() {
  ALL_STORES.forEach((store) => {
    store?.getState().clear();
  });
}

export function refreshAllStores() {
  ALL_STORES.forEach((store) => store?.getState().refresh());
}

export default function createDBCollectionStore<Type extends Item>({
  getCollection,
  eagerlyFetchFirstBatch
}: {
  getCollection: () => Promise<VirtualizedGrouping<Type>>;
  eagerlyFetchFirstBatch?: boolean;
}) {
  const useDBCollectionStore = create<DBCollectionStore<Type>>((set, get) => ({
    items: undefined,
    loading: true,
    refresh: async () => {
      try {
        const items = await getCollection();
        if (get().loading && eagerlyFetchFirstBatch) {
          await items.item(0, resolveItems);
        }
        set({
          items,
          loading: false
        });
      } catch (e) {
        DatabaseLogger.error(e as Error, "useDBCollectionStore.refresh", {
          useDBCollectionStore: "refresh"
        });
        ToastManager.error(e as Error, "Failed to load items");
      }
    },
    clear: () => set({ items: undefined, loading: true })
  }));

  const useStoreHook = (): [
    VirtualizedGrouping<Type> | undefined,
    boolean,
    () => Promise<void>
  ] => {
    const isAppLoading = useSettingStore((state) => state.isAppLoading);
    const [items, loading] = useDBCollectionStore((state) => [
      state.items,
      state.loading
    ]);

    if (!items && !isAppLoading) {
      useDBCollectionStore.getState().refresh();
    }

    return [items, loading, useDBCollectionStore.getState().refresh];
  };

  ALL_STORES.push(useDBCollectionStore as any);
  return {
    useStore: useDBCollectionStore,
    useCollection: useStoreHook
  };
}
