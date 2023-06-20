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
import Home from "../views/home";
import Notebooks from "../views/notebooks";
import Notes from "../views/notes";
import Search from "../views/search";
import Tags from "../views/tags";
import Topics from "../views/topics";
import { navigate } from ".";
import Trash from "../views/trash";
import { store as notestore } from "../stores/note-store";
import { store as nbstore } from "../stores/notebook-store";
import Reminders from "../views/reminders";
import { defineRoutes } from "./types";
import React from "react";
import { RouteContainerButtons } from "../components/route-container";
import { CREATE_BUTTON_MAP } from "../common";

type RouteResult = {
  key: string;
  type: "notes" | "notebooks" | "reminders" | "trash" | "tags" | "search";
  title?: string;
  component: React.FunctionComponent;
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
      component: Home,
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
  "/notebooks/:notebookId": ({ notebookId }) => {
    const notebook = db.notebooks?.notebook(notebookId);
    if (!notebook) return false;
    nbstore.setSelectedNotebook(notebookId);
    notestore.setContext({
      type: "notebook",
      value: { id: notebookId }
    });

    return defineRoute({
      key: "notebook",
      type: "notes",
      component: Topics,
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        back: {
          title: "Go back to notebooks",
          onClick: () => navigate("/notebooks")
        },
        search: {
          title: `Search ${notebook.title} notes`
        }
      }
    });
  },
  "/notebooks/:notebookId/:topicId": ({ notebookId, topicId }) => {
    const notebook = db.notebooks?.notebook(notebookId);
    const topic = notebook?.topics?.topic(topicId)?._topic;
    if (!topic) return false;
    nbstore.setSelectedNotebook(notebookId);
    notestore.setContext({
      type: "topic",
      value: { id: notebookId, topic: topicId }
    });
    return defineRoute({
      key: "notebook",
      type: "notes",
      title: topic.title,
      component: Topics,
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        back: {
          title: `Go back to ${notebook.title}`,
          onClick: () => navigate(`/notebooks/${notebookId}`)
        },
        search: {
          title: `Search ${notebook.title} ${topic.title} notes`
        }
      }
    });
  },
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
    const tag = db.tags?.tag(tagId);
    if (!tag) return false;
    const { id } = tag;
    notestore.setContext({ type: "tag", value: id });
    const title = db.tags?.alias(id);
    return defineRoute({
      key: "notes",
      type: "notes",
      title: `#${title}`,
      component: Notes,
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        back: {
          title: "Go back to tags",
          onClick: () => navigate("/tags")
        },
        search: {
          title: `Search #${title} notes`
        }
      }
    });
  },
  "/colors/:colorId": ({ colorId }) => {
    const color = db.colors?.tag(colorId);
    if (!color) {
      navigate("/");
      return false;
    }
    const { id } = color;
    const title = db.colors?.alias(id);
    notestore.setContext({ type: "color", value: id });
    return defineRoute({
      key: "notes",
      type: "notes",
      title: title,
      component: Notes,
      buttons: {
        create: CREATE_BUTTON_MAP.notes,
        search: {
          title: `Search ${title} colored notes`
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
  },
  "/search/:type": ({ type }) =>
    defineRoute({
      key: "general",
      type: "search",
      title: "Search",
      component: () => <Search type={type} />,
      buttons: {
        back: {
          title: `Go back to ${type}`,
          onClick: () => window.history.back()
        }
      }
    })
});

export default routes;
export type Route = keyof typeof routes;
