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

import create, { State } from "zustand";
import { COLORS_NOTE } from "../utils/color-scheme";
import {
  ColorType,
  MonographType,
  NotebookType,
  TagType,
  TopicType
} from "../utils/types";

export type GenericRouteParam = { [name: string]: unknown };

export type NotebookScreenParams = {
  item: NotebookType;
  title: string;
  canGoBack: boolean;
};

export type NotesScreenParams = {
  item: TopicType | TagType | ColorType | MonographType;
  title: string;
  canGoBack: boolean;
};

export type AppLockRouteParams = {
  welcome: boolean;
  canGoBack: boolean;
};

export type AuthParams = {
  mode: number;
  title: string;
  canGoBack: boolean;
};

export type RouteParams = {
  Notes: GenericRouteParam;
  Notebooks: GenericRouteParam;
  Notebook: NotebookScreenParams;
  NotesPage: NotesScreenParams;
  Tags: GenericRouteParam;
  Favorites: GenericRouteParam;
  Trash: GenericRouteParam;
  Search: GenericRouteParam;
  Settings: GenericRouteParam;
  TaggedNotes: NotesScreenParams;
  ColoredNotes: NotesScreenParams;
  TopicNotes: NotesScreenParams;
  Monographs: NotesScreenParams;
  AppLock: AppLockRouteParams;
  Auth: AuthParams;
  Reminders: GenericRouteParam;
  SettingsGroup: GenericRouteParam;
};

export type RouteName = keyof RouteParams;

export type CurrentScreen = {
  name: RouteName;
  id?: string;
  title?: string;
  type?: string;
  color?: string | null;
  alias?: string;
  notebookId?: string;
  beta?: boolean;
};

export type HeaderRightButton = {
  title: string;
  onPress: () => void;
};

interface NavigationStore extends State {
  currentScreen: CurrentScreen;
  currentScreenRaw: CurrentScreen;
  canGoBack: boolean | undefined;
  update: (
    currentScreen: CurrentScreen,
    canGoBack?: boolean,
    headerRightButtons?: HeaderRightButton[]
  ) => void;
  headerRightButtons?: HeaderRightButton[];
  buttonAction: () => void;
  setButtonAction: (buttonAction: () => void) => void;
}

const useNavigationStore = create<NavigationStore>((set, get) => ({
  currentScreen: {
    name: "Notes",
    id: "notes_navigation",
    title: "Notes",
    type: "notes"
  },
  currentScreenRaw: { name: "Notes" },
  canGoBack: false,
  update: (currentScreen, canGoBack, headerRightButtons) => {
    const color =
      COLORS_NOTE[
        currentScreen.color?.toLowerCase() as keyof typeof COLORS_NOTE
      ];
    if (
      JSON.stringify(currentScreen) === JSON.stringify(get().currentScreenRaw)
    )
      return;
    set({
      currentScreen: {
        name: currentScreen.name,
        id:
          currentScreen.id || currentScreen.name.toLowerCase() + "_navigation",
        title: currentScreen.alias || currentScreen.title || currentScreen.name,
        type: currentScreen.type,
        color: color,
        notebookId: currentScreen.notebookId,
        beta: currentScreen.beta
      },
      currentScreenRaw: currentScreen,
      canGoBack,
      headerRightButtons: headerRightButtons
    });
  },
  headerRightButtons: [],
  buttonAction: () => null,
  setButtonAction: (buttonAction) => set({ buttonAction })
}));

export default useNavigationStore;
