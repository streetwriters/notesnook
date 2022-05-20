//@ts-ignore
import { db } from '../utils/database';
import { useNoteStore } from './use-notes-store';
import { useFavoriteStore } from './use-favorite-store';
import { useMenuStore } from './use-menu-store';
import { useNotebookStore } from './use-notebook-store';
import { useTagStore } from './use-tag-store';
import { useTrashStore } from './use-trash-store';

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
