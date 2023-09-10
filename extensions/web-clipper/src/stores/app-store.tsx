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
import create from "zustand";
import { ItemReference, NotebookReference, User } from "../common/bridge";
import { connectApi } from "../api";

interface AppStore {
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  user?: User;
  notes: ItemReference[];
  notebooks: NotebookReference[];
  tags: ItemReference[];
  route: string;

  login(openNew?: boolean): Promise<void>;
  navigate(route: string): void;
}

export const useAppStore = create<AppStore>((set) => ({
  isLoggedIn: false,
  isLoggingIn: false,
  notebooks: [],
  notes: [],
  tags: [],
  route: "/login",

  navigate(route) {
    set({ route });
  },

  async login(openNew = false) {
    set({ isLoggingIn: true });

    const notesnook = await connectApi(openNew, () => {
      set({
        user: undefined,
        isLoggedIn: false,
        isLoggingIn: false,
        notes: [],
        notebooks: [],
        tags: []
      });
    });

    if (!notesnook) {
      set({ isLoggingIn: false });
      throw new Error(
        "Please refresh the Notesnook web app to connect with the Web Clipper."
      );
    }

    const user = await notesnook.login();
    const notes = await notesnook.getNotes();
    const notebooks = await notesnook.getNotebooks();
    const tags = await notesnook.getTags();

    set({
      user: user || undefined,
      isLoggedIn: true,
      isLoggingIn: false,
      notes: notes,
      notebooks: notebooks,
      tags: tags
    });
  }
}));
