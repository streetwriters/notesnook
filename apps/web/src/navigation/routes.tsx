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
import Notebooks from "../views/notebooks";
import Notes from "../views/notes";
import Tags from "../views/tags";
import Notebook from "../views/notebook";
import { navigate } from ".";
import Trash from "../views/trash";
import { store as notestore } from "../stores/note-store";
import Reminders from "../views/reminders";
import { defineRoutes } from "./types";
import React from "react";
import { RouteContainerButtons } from "../components/route-container";
import { CREATE_BUTTON_MAP } from "../common";

type RouteResult = {
  key: string;
  type: "notes" | "notebooks" | "reminders" | "trash" | "tags";
  title?: string | (() => Promise<string | undefined>);
  component: React.ReactNode;
  props?: any;
  buttons?: RouteContainerButtons;
};

function defineRoute(route: RouteResult): RouteResult {
  return route;
}

const routes = defineRoutes({
  "/notes": () =>
    defineRoute({
      key: "home",
      type: "notes",
      title: "Notes",
      component: AllNotes,
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        search: {
          title: "Search notes"
        }
      }
    }),
  "/notebooks": () =>
    defineRoute({
      key: "notebooks",
      type: "notebooks",
      title: "Notebooks",
      component: Notebooks,
      buttons: {
        create: CREATE_BUTTON_MAP.notebooks,
        search: {
          title: "Search notebooks"
        }
      }
    }),
  "/notebooks/:rootId/:notebookId?": ({ rootId, notebookId }) => {
    return defineRoute({
      key: "notebook",
      type: "notes",
      component: Notebook,
      props: {
        rootId,
        notebookId
      },
      //  () => (
      //   <Notebook key={rootId} rootId={rootId} notebookId={notebookId} />
      // ),
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        back: {
          title: "Go back to notebooks",
          onClick: () => navigate("/notebooks")
        },
        search: {
          title: `Search notes`
        }
      }
    });
  },
  // "/notebooks/:rootId/:notebookId": ({ notebookId, rootId }) => {
  //   return defineRoute({
  //     key: "notebook",
  //     type: "notes",
  //     // title: topic.title,
  //     component: () => (
  //       <Notebook key={rootId} rootId={rootId} notebookId={notebookId} />
  //     ),
  //     buttons: {
  //       create: CREATE_BUTTON_MAP.notes,
  //       back: {
  //         title: `Go back to notebooks`, // ${notebook.title}`,
  //         onClick: () => navigate(`/notebooks/${rootId}`)
  //       },
  //       search: {
  //         title: `Search notes`
  //       }
  //     }
  //   });
  // },
  "/favorites": () => {
    notestore.setContext({ type: "favorite" });
    return defineRoute({
      key: "notes",
      title: "Favorites",
      type: "notes",
      component: Notes,
      buttons: {
        search: {
          title: "Search favorite notes"
        }
      }
    });
  },
  "/reminders": () => {
    return defineRoute({
      key: "reminders",
      title: "Reminders",
      type: "reminders",
      component: Reminders,
      buttons: {
        create: CREATE_BUTTON_MAP.reminders,
        search: {
          title: "Search reminders"
        }
      }
    });
  },
  "/trash": () =>
    defineRoute({
      key: "trash",
      type: "trash",
      title: "Trash",
      component: Trash,
      buttons: {
        search: {
          title: "Search trash"
        }
      }
    }),
  "/tags": () =>
    defineRoute({
      key: "tags",
      title: "Tags",
      type: "tags",
      component: Tags,
      buttons: {
        create: CREATE_BUTTON_MAP.tags,
        search: {
          title: "Search tags"
        }
      }
    }),
  "/tags/:tagId": ({ tagId }) => {
    notestore.setContext({ type: "tag", id: tagId });
    return defineRoute({
      key: "notes",
      type: "notes",
      title: async () => {
        const tag = await db.tags.tag(tagId);
        if (!tag) return;
        return `#${tag.title}`;
      },
      component: Notes,
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        back: {
          title: "Go back to tags",
          onClick: () => navigate("/tags")
        },
        search: {
          title: `Search notes`
        }
      }
    });
  },
  "/colors/:colorId": ({ colorId }) => {
    notestore.setContext({ type: "color", id: colorId });
    return defineRoute({
      key: "notes",
      type: "notes",
      title: async () => {
        const color = await db.colors.color(colorId);
        if (!color) return;
        return `${color.title}`;
      },
      component: Notes,
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        search: {
          title: `Search notes`
        }
      }
    });
  },
  "/monographs": () => {
    notestore.setContext({ type: "monographs" });
    return defineRoute({
      key: "notes",
      title: "Monographs",
      type: "notes",
      component: Notes,
      buttons: {
        search: {
          title: "Search monograph notes"
        }
      }
    });
  }
});

export default routes;
export type Route = keyof typeof routes;
