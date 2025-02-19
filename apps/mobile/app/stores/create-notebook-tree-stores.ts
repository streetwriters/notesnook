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
import { Notebook } from "@notesnook/core";
import create from "zustand";
import { persist, StateStorage } from "zustand/middleware";
import { db } from "../common/database";
import { MMKV } from "../common/database/mmkv";
import { createItemSelectionStore } from "./item-selection-store";

export type TreeItem = {
  parentId: string;
  notebook: Notebook;
  depth: number;
  hasChildren: boolean;
};

function removeTreeItem(tree: TreeItem[], id: string) {
  const children: TreeItem[] = [];
  let newTree = tree.filter((item) => {
    if (item.parentId === id) children.push(item);
    return item.notebook.id !== id;
  });
  for (const child of children) {
    newTree = removeTreeItem(newTree, child.notebook.id);
  }
  return newTree;
}

export function createNotebookTreeStores(
  multiSelect: boolean,
  selectionEnabled: boolean
) {
  const useSideMenuNotebookTreeStore = create<{
    tree: TreeItem[];
    setTree: (tree: TreeItem[]) => void;
    removeItem: (id: string) => void;
    addNotebooks: (
      parentId: string,
      notebooks: Notebook[],
      depth: number,
      tree?: TreeItem[]
    ) => Promise<TreeItem[]>;
    updateItem: (id: string, notebook: Notebook) => void;
    fetchAndAdd: (
      parentId: string,
      depth: number,
      tree?: TreeItem[]
    ) => Promise<TreeItem[]>;
    removeChildren: (id: string) => void;
  }>((set, get) => ({
    tree: [],
    setTree(tree) {
      set({ tree });
    },
    updateItem: async (id, notebook) => {
      const newTree = get().tree.slice();
      const index = newTree.findIndex((item) => item.notebook.id === id);
      const childernCount = await db.relations
        .from(notebook, "notebook")
        .count();
      newTree[index] = {
        ...newTree[index],
        notebook,
        hasChildren: childernCount > 0
      };

      set({
        tree: newTree
      });
    },
    addNotebooks: async (
      parentId: string,
      notebooks: Notebook[],
      depth: number,
      tree?: TreeItem[]
    ) => {
      const items = await db.relations
        .from(
          {
            type: "notebook",
            ids: notebooks.map((item) => item.id)
          },
          "notebook"
        )
        .get();

      let newTree = tree || get().tree.slice();

      const parentIndex = newTree.findIndex(
        (item) => item.notebook.id === parentId
      );

      for (const item of newTree) {
        if (item.parentId === parentId) {
          newTree = removeTreeItem(newTree, item.notebook.id);
        }
      }

      const newTreeItems = notebooks.map((notebook) => {
        return {
          parentId,
          notebook,
          depth: depth,
          hasChildren: items.some((item) => {
            return item.fromId === notebook.id;
          })
        };
      });

      newTree.splice(parentIndex + 1, 0, ...newTreeItems);

      for (const item of newTreeItems) {
        const expanded =
          useSideMenuNotebookExpandedStore.getState().expanded[
            item.notebook.id
          ] && item.hasChildren;
        if (expanded) {
          newTree = await get().fetchAndAdd(
            item.notebook.id,
            depth + 1,
            newTree
          );
        }
      }

      return newTree;
    },

    removeItem(id) {
      set({
        tree: removeTreeItem(get().tree, id).slice()
      });
    },
    fetchAndAdd: async (parentId: string, depth: number, tree?: TreeItem[]) => {
      const selector = db.relations.from(
        {
          type: "notebook",
          id: parentId
        },
        "notebook"
      ).selector;

      const grouped = await selector.sorted(
        db.settings.getGroupOptions("notebooks")
      );
      const notebooks: Notebook[] = [];
      for (let index = 0; index < grouped.placeholders.length; index++) {
        const notebook = (await grouped.item(index)).item;
        if (notebook) notebooks.push(notebook);
      }

      tree = await get().addNotebooks(parentId, notebooks, depth, tree);

      return tree;
    },
    removeChildren(id: string) {
      let newTree = get().tree.slice();
      for (const item of newTree) {
        if (item.parentId === id) {
          newTree = removeTreeItem(newTree, item.notebook.id);
        }
      }
      set({
        tree: newTree
      });
    }
  }));

  const useSideMenuNotebookSelectionStore = createItemSelectionStore(
    multiSelect,
    selectionEnabled
  );

  const useSideMenuNotebookExpandedStore = create<{
    expanded: {
      [id: string]: boolean;
    };
    setExpanded: (id: string) => void;
  }>(
    persist(
      (set, get) => ({
        expanded: {
          root: true
        },
        setExpanded(id: string) {
          set({
            expanded: {
              ...get().expanded,
              [id]: !get().expanded[id]
            }
          });
        }
      }),
      {
        name: "side-menu-notebook-expanded-v1",
        getStorage: () => MMKV as unknown as StateStorage
      }
    )
  );

  return {
    useSideMenuNotebookTreeStore,
    useSideMenuNotebookSelectionStore,
    useSideMenuNotebookExpandedStore
  };
}
