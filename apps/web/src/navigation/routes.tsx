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

import { db } from "../common/db";
import AllNotes from "../views/all-notes";
import Notes from "../views/notes";
import { NotebookHeader } from "../components/notebook-header";
import Trash from "../views/trash";
import { useStore as useNoteStore } from "../stores/note-store";
import { useStore as useAppStore } from "../stores/app-store";
import Reminders from "../views/reminders";
import { RouteResult, defineRoutes } from "./types";
import { CREATE_BUTTON_MAP } from "../common";
import { strings } from "@notesnook/intl";

function defineRoute(route: RouteResult): RouteResult {
  return route;
}

const NOT_FOUND_ROUTE = defineRoute({
  key: "notFound",
  type: "notFound",
  component: () => <div>Not found</div>
});
const routes = defineRoutes({
  "/notes": () => {
    useNoteStore.getState().setContext();
    return defineRoute({
      key: "home",
      type: "notes",
      title: strings.routes.Notes(),
      component: AllNotes,
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        search: {
          title: strings.searchANote()
        }
      }
    });
  },
  "/notebooks/:notebookId": async ({ notebookId }) => {
    const notebook = await db.notebooks.notebook(notebookId);
    if (!notebook) return NOT_FOUND_ROUTE;
    const totalNotes = await db.relations.from(notebook, "note").count();
    useNoteStore.getState().setContext({
      type: "notebook",
      id: notebookId,
      item: notebook,
      totalNotes
    });

    return defineRoute({
      key: "notebook",
      type: "notebook",
      component: Notes,
      title: notebook.title,
      props: {
        header: <NotebookHeader notebook={notebook} totalNotes={totalNotes} />
      }
    });
  },
  "/favorites": () => {
    useNoteStore.getState().setContext({ type: "favorite" });
    return defineRoute({
      key: "notes",
      title: strings.routes.Favorites(),
      type: "notes",
      component: Notes
    });
  },
  "/reminders": () => {
    useNoteStore.getState().setContext();
    return defineRoute({
      key: "reminders",
      title: strings.routes.Reminders(),
      type: "reminders",
      component: Reminders,
      buttons: {
        create: CREATE_BUTTON_MAP.reminders
      }
    });
  },
  "/trash": () => {
    useNoteStore.getState().setContext();
    return defineRoute({
      key: "trash",
      type: "trash",
      title: strings.routes.Trash(),
      component: Trash
    });
  },
  "/tags/:tagId": async ({ tagId }) => {
    const tag = await db.tags.tag(tagId);
    if (!tag) return NOT_FOUND_ROUTE;
    useNoteStore.getState().setContext({ type: "tag", id: tagId });
    return defineRoute({
      key: "notes",
      type: "notes",
      title: `#${tag.title}`,
      component: Notes
    });
  },
  "/colors/:colorId": async ({ colorId }) => {
    const color = await db.colors.color(colorId);
    if (!color) return NOT_FOUND_ROUTE;
    useNoteStore.getState().setContext({ type: "color", id: colorId });
    return defineRoute({
      key: "notes",
      type: "notes",
      title: color.title,
      component: Notes
    });
  },
  "/monographs": () => {
    useNoteStore.getState().setContext({ type: "monographs" });
    return defineRoute({
      key: "notes",
      title: strings.routes.Monographs(),
      type: "notes",
      component: Notes
    });
  }
});

export default routes;
export type Route = keyof typeof routes;
