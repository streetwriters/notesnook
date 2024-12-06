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
import { db } from "../common/database";
import { createItemSelectionStore } from "./item-selection-store";

export type TreeItem = {
  parentId: string;
  notebook: Notebook;
  depth: number;
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
      depth: number
    ) => void;
    updateItem: (id: string, notebook: Notebook) => void;
    fetchAndAdd: (parentId: string, depth: number) => Promise<void>;
    removeChildren: (id: string) => void;
  }>((set, get) => ({
    tree: [],
    setTree(tree) {
      set({ tree });
    },
    updateItem: (id, notebook) => {
      const newTree = [...get().tree];
      const index = newTree.findIndex((item) => item.notebook.id === id);
      newTree[index] = {
        ...newTree[index],
        notebook
      };
      set({
        tree: newTree
      });
    },
    addNotebooks: (parentId: string, notebooks: Notebook[], depth: number) => {
      const parentIndex = get().tree.findIndex(
        (item) => item.notebook.id === parentId
      );

      let newTree = get().tree.slice();
      for (const item of newTree) {
        if (item.parentId === parentId) {
          newTree = removeTreeItem(newTree, item.notebook.id);
        }
      }
      newTree.splice(
        parentIndex + 1,
        0,
        ...notebooks.map((notebook) => {
          return {
            parentId,
            notebook,
            depth: depth
          };
        })
      );
      set({
        tree: newTree
      });
    },

    removeItem(id) {
      set({
        tree: removeTreeItem(get().tree, id).slice()
      });
    },
    fetchAndAdd: async (parentId: string, depth: number) => {
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
      get().addNotebooks(parentId, notebooks, depth);
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
  }>((set, get) => ({
    expanded: {},
    setExpanded(id: string) {
      set({
        expanded: {
          ...get().expanded,
          [id]: !get().expanded[id]
        }
      });
    }
  }));

  return {
    useSideMenuNotebookTreeStore,
    useSideMenuNotebookSelectionStore,
    useSideMenuNotebookExpandedStore
  };
}
