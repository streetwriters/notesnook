import create from "zustand";
import {
  ItemReference,
  NotebookReference,
  User
} from "../common/bridge";
import { connectApi } from "../api";

interface AppStore {
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  user?: User;
  notes: ItemReference[];
  notebooks: NotebookReference[];
  tags: ItemReference[];

  login(openNew?: boolean): Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  isLoggedIn: false,
  isLoggingIn: false,
  notebooks: [],
  notes: [],
  tags: [],

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
      return;
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
