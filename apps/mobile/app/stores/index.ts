import { db } from "../common/database";
import Navigation from "../services/navigation";
import { useFavoriteStore } from "./use-favorite-store";
import { useMenuStore } from "./use-menu-store";
import { RouteName } from "./use-navigation-store";
import { useNotebookStore } from "./use-notebook-store";
import { useNoteStore } from "./use-notes-store";
import { useTagStore } from "./use-tag-store";
import { useTrashStore } from "./use-trash-store";

export function initAfterSync() {
  useMenuStore.getState().setColorNotes();
  useMenuStore.getState().setMenuPins();
  Navigation.queueRoutesForUpdate(
    ...(Object.keys(Navigation.routeUpdateFunctions) as unknown as RouteName[])
  );
}

export function initialize() {
  if (!db) return;
  setImmediate(() => {
    useMenuStore.getState().setColorNotes();
    useMenuStore.getState().setMenuPins();
    useNotebookStore.getState().setNotebooks();
    useTrashStore.getState().setTrash();
    useTagStore.getState().setTags();
    useFavoriteStore.getState().setFavorites();
    useNoteStore.getState().setNotes();
  });
}

export function clearAllStores() {
  useNotebookStore.getState().clearNotebooks();
  useTagStore.getState().clearTags();
  useFavoriteStore.getState().clearFavorites();
  useMenuStore.getState().clearAll();
  useNoteStore.getState().clearNotes();
  useMenuStore.getState().clearAll();
  useTrashStore.getState().clearTrash();
}
