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

import {
  Color,
  ItemType,
  Note,
  Notebook,
  Reminder,
  Tag,
  TrashItem
} from "@notesnook/core/dist/types";
import create, { State } from "zustand";
import { ColorValues } from "../utils/colors";

export type GenericRouteParam = undefined;

export type NotebookScreenParams = {
  item: Notebook;
  title: string;
  canGoBack?: boolean;
};

export type NotesScreenParams = {
  item: Note | Notebook | Tag | Color | TrashItem | Reminder;
  title: string;
  canGoBack?: boolean;
};

export type AppLockRouteParams = {
  welcome: boolean;
  canGoBack?: boolean;
};

export type AuthParams = {
  mode: number;
  title: string;
  canGoBack?: boolean;
};

export type RouteParams = {
  Notes: GenericRouteParam;
  Notebooks: {
    canGoBack?: boolean;
  };
  Notebook: NotebookScreenParams;
  NotesPage: NotesScreenParams;
  Tags: GenericRouteParam;
  Favorites: GenericRouteParam;
  Trash: GenericRouteParam;
  Search: {
    placeholder: string;
    type: ItemType;
    title: string;
    route: RouteName;
    ids?: string[];
  };
  Settings: GenericRouteParam;
  TaggedNotes: NotesScreenParams;
  ColoredNotes: NotesScreenParams;
  TopicNotes: NotesScreenParams;
  Monographs: NotesScreenParams;
  AppLock: AppLockRouteParams;
  Reminders: GenericRouteParam;
  SettingsGroup: GenericRouteParam;
};

export type RouteName = keyof RouteParams;

export type HeaderRightButton = {
  title: string;
  onPress: () => void;
};

interface NavigationStore extends State {
  currentRoute: RouteName;
  canGoBack?: boolean;
  focusedRouteId?: string;
  update: (currentScreen: RouteName) => void;
  headerRightButtons?: HeaderRightButton[];
  buttonAction: () => void;
  setButtonAction: (buttonAction: () => void) => void;
  setFocusedRouteId: (id?: string) => void;
}

const useNavigationStore = create<NavigationStore>((set, get) => ({
  focusedRouteId: "Notes",
  setFocusedRouteId: (id) => {
    set({
      focusedRouteId: id
    });
    console.log("CurrentRoute ID", id);
  },
  currentRoute: "Notes",
  canGoBack: false,
  update: (currentScreen) => {
    set({
      currentRoute: currentScreen
    });
    console.log("CurrentRoute", currentScreen);
  },
  headerRightButtons: [],
  buttonAction: () => null,
  setButtonAction: (buttonAction) => set({ buttonAction })
}));

export default useNavigationStore;
