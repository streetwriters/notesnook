import { EV, EVENTS } from "@notesnook/core";
import { useEffect, useState } from "react";
import { db } from "../common/database";
import { useNotebookStore } from "../stores/use-notebook-store";
import { useNoteStore } from "../stores/use-notes-store";
import { useFavoriteStore } from "../stores/use-favorite-store";
import Navigation from "../services/navigation";

export const useNotebookLock = (id: string) => {
  const [locked, setLocked] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);

  useEffect(() => {
    const events = [
      EV.subscribe(EVENTS.notebookLockOpened, (_id: string) => {
        if (_id === id) {
          setNotebookOpen(true);
          if (!db.notebooks.isLocked(_id)) {
            setLocked(false);
          }
        }
      }),
      EV.subscribe(EVENTS.notebooksLocked, (ids: string[]) => {
        if (ids.includes(id)) {
          setLocked(true);
          setNotebookOpen(false);
        }
      })
    ];
    setLocked(db.notebooks.isLocked(id));
    setNotebookOpen(db.notebooks.isLockOpen(id));
    return () => {
      events.forEach((e) => e.unsubscribe());
    };
  }, [id]);

  return {
    locked,
    notebookOpen: locked ? notebookOpen : true,
    lock: async (password: string) => {
      await db.notebooks.lock(id, password);
      setLocked(true);
      setNotebookOpen(false);
      useNotebookStore.getState().refresh();
      useNoteStore.getState().refresh();
      useFavoriteStore.getState().refresh();
      Navigation.queueRoutesForUpdate();
    },
    unlock: async () => {
      db.notebooks.unlock(id);
      setLocked(false);
      setNotebookOpen(false);
      useNotebookStore.getState().refresh();
      useNoteStore.getState().refresh();
      useFavoriteStore.getState().refresh();
      Navigation.queueRoutesForUpdate();
    },
    open: async (password: string) => {
      const open = await db.notebooks.openLock(id, password);
      if (!open) return false;
      setNotebookOpen(open);
      return open;
    }
  };
};
