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

import { StackActions } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFavoriteStore } from "../stores/use-favorite-store";
import useNavigationStore, {
  CurrentScreen,
  GenericRouteParam,
  RouteName,
  RouteParams
} from "../stores/use-navigation-store";
import { useNotebookStore } from "../stores/use-notebook-store";
import { useNoteStore } from "../stores/use-notes-store";
import { useReminderStore } from "../stores/use-reminder-store";
import { useTagStore } from "../stores/use-tag-store";
import { useTrashStore } from "../stores/use-trash-store";
import { eOnNewTopicAdded } from "../utils/events";
import { rootNavigatorRef, tabBarRef } from "../utils/global-refs";
import { eSendEvent } from "./event-manager";
import SettingsService from "./settings";
import SearchService from "./search";

/**
 * Routes that should be updated on focus
 */
let routesUpdateQueue: RouteName[] = [];

const routeNames = {
  Notes: "Notes",
  Notebooks: "Notebooks",
  Notebook: "Notebook",
  NotesPage: "NotesPage",
  Tags: "Tags",
  Favorites: "Favorites",
  Trash: "Trash",
  Search: "Search",
  Settings: "Settings",
  TaggedNotes: "TaggedNotes",
  ColoredNotes: "ColoredNotes",
  TopicNotes: "TopicNotes",
  Monographs: "Monographs",
  Auth: "Auth",
  Intro: "Intro",
  Welcome: "Welcome",
  AppLock: "AppLock",
  Login: "Login",
  Signup: "Signup",
  Reminders: "Reminders"
};

export type NavigationProps<T extends RouteName> = NativeStackScreenProps<
  RouteParams,
  T
>;

/**
 * Functions to update each route when required.
 */
const routeUpdateFunctions: {
  [name: string]: (...params: GenericRouteParam[]) => void;
} = {
  Notes: () => useNoteStore.getState().setNotes(),
  Notebooks: () => useNotebookStore.getState().setNotebooks(),
  Tags: () => useTagStore.getState().setTags(),
  Favorites: () => useFavoriteStore.getState().setFavorites(),
  Trash: () => useTrashStore.getState().setTrash(),
  Notebook: (params) => eSendEvent(eOnNewTopicAdded, params),
  NotesPage: (params) => eSendEvent("NotesPage", params),
  TaggedNotes: (params) => eSendEvent("TaggedNotes", params),
  ColoredNotes: (params) => eSendEvent("ColoredNotes", params),
  TopicNotes: (params) => eSendEvent("TopicNotes", params),
  Monographs: (params) => eSendEvent("Monographs", params),
  Reminders: () => useReminderStore.getState().setReminders(),
  Search: () => SearchService.updateAndSearch()
};

function clearRouteFromQueue(routeName: RouteName) {
  if (routesUpdateQueue.indexOf(routeName) !== -1) {
    routesUpdateQueue = [...new Set(routesUpdateQueue)];
    routesUpdateQueue.splice(routesUpdateQueue.indexOf(routeName), 1);
  }
}

/**
 * Check if a route needs update
 */
function routeNeedsUpdate(routeName: RouteName, callback: () => void) {
  if (routesUpdateQueue.indexOf(routeName) > -1) {
    clearRouteFromQueue(routeName);
    callback();
  }
}

function queueRoutesForUpdate(...routesToUpdate: RouteName[]) {
  const routes =
    routesToUpdate?.length > 0
      ? routesToUpdate
      : (Object.keys(routeNames) as (keyof RouteParams)[]);
  const currentScreen = useNavigationStore.getState().currentScreen;
  if (routes.indexOf(currentScreen.name) > -1) {
    routeUpdateFunctions[currentScreen.name]?.();
    clearRouteFromQueue(currentScreen.name);
    // Remove focused screen from queue
    routes.splice(routes.indexOf(currentScreen.name), 1);
  }
  routesUpdateQueue = routesUpdateQueue.concat(routes);
  routesUpdateQueue = [...new Set(routesUpdateQueue)];
}

function navigate<T extends RouteName>(
  screen: CurrentScreen,
  params: RouteParams[T]
) {
  useNavigationStore.getState().update(screen, !!params?.canGoBack);
  if (screen.name === "Notebook") routeUpdateFunctions["Notebook"](params);
  if (screen.name.endsWith("Notes") && screen.name !== "Notes")
    routeUpdateFunctions[screen.name]?.(params);
  //@ts-ignore Not sure how to fix this for now ignore it.
  rootNavigatorRef.current?.navigate<RouteName>(screen.name, params);
}

function goBack() {
  rootNavigatorRef.current?.goBack();
}

function push<T extends RouteName>(
  screen: CurrentScreen,
  params: RouteParams[T]
) {
  useNavigationStore.getState().update(screen, !!params?.canGoBack);
  rootNavigatorRef.current?.dispatch(StackActions.push(screen.name, params));
}

function replace<T extends RouteName>(
  screen: CurrentScreen,
  params: RouteParams[T]
) {
  useNavigationStore.getState().update(screen, !!params?.canGoBack);
  rootNavigatorRef.current?.dispatch(StackActions.replace(screen.name, params));
}

function popToTop() {
  rootNavigatorRef.current?.dispatch(StackActions.popToTop());
  useNavigationStore.getState().update({
    name: (SettingsService.get().homepage as RouteName) || "Notes"
  });
}

function openDrawer() {
  tabBarRef.current?.openDrawer();
}
function closeDrawer() {
  tabBarRef.current?.closeDrawer();
}

const Navigation = {
  navigate,
  goBack,
  push,
  openDrawer,
  closeDrawer,
  replace,
  popToTop,
  queueRoutesForUpdate,
  routeNeedsUpdate,
  routeNames,
  routeUpdateFunctions
};

export default Navigation;
