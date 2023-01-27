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
import Notes from "../views/notes.js";
import Search from "../views/search";
import Settings from "../views/settings";
import Tags from "../views/tags";
import Topics from "../views/topics";
import { navigate } from "../navigation";
import Trash from "../views/trash";
import { store as notestore } from "../stores/note-store";
import { store as nbstore } from "../stores/notebook-store";
import { showToast } from "../utils/toast";
import Reminders from "../views/reminders";

const routes = {
  "/notes": () => {
    notestore.clearSearch();
    return {
      key: "home",
      type: "notes",
      title: "Notes",
      component: <Home />,
      buttons: {
        search: {
          title: "Search notes"
        }
      }
    };
  },
  "/notebooks": () => {
    notestore.clearSearch();
    return {
      key: "notebooks",
      type: "notebooks",
      title: "Notebooks",
      component: <Notebooks />,
      buttons: {
        search: {
          title: "Search notebooks"
        }
      }
    };
  },
  "/notebooks/:notebookId": ({ notebookId }) => {
    const notebook = db.notebooks.notebook(notebookId);
    if (!notebook) return false;
    nbstore.setSelectedNotebook(notebookId);
    notestore.clearSearch();
    return {
      key: "topics",
      type: "topics",
      component: <Topics />,
      buttons: {
        back: {
          title: "Go back to notebooks",
          action: () => navigate("/notebooks")
        },
        search: {
          title: `Search ${notebook.title} topics`
        }
      }
    };
  },
  "/notebooks/:notebookId/:topicId": ({ notebookId, topicId }) => {
    const notebook = db.notebooks.notebook(notebookId);
    const topic = notebook?.topics?.topic(topicId)?._topic;
    if (!topic) return false;
    notestore.setContext({
      type: "topic",
      value: { id: notebookId, topic: topicId }
    });
    notestore.clearSearch();
    return {
      key: "notes",
      type: "notes",
      title: topic.title,
      subtitle: notebook.title,
      isEditable: true,
      onChange: (title) => {
        db.notebooks.notebook(notebookId).topics.add({ ...topic, title });
        showToast("success", "Topic title updated!");
      },
      component: <Notes />,
      buttons: {
        back: {
          title: `Go back to ${notebook.title}`,
          action: () => navigate(`/notebooks/${notebookId}`)
        },
        search: {
          title: `Search ${notebook.title} ${topic.title} notes`
        }
      }
    };
  },
  "/favorites": () => {
    notestore.setContext({ type: "favorite" });
    notestore.clearSearch();
    return {
      key: "notes",
      title: "Favorites",
      type: "notes",
      component: <Notes />,
      buttons: {
        search: {
          title: "Search favorite notes"
        }
      }
    };
  },
  "/reminders": () => {
    notestore.clearSearch();
    return {
      key: "reminders",
      title: "Reminders",
      type: "reminders",
      component: <Reminders />,
      buttons: {
        search: {
          title: "Search reminders"
        }
      }
    };
  },
  "/trash": () => {
    notestore.clearSearch();
    return {
      key: "trash",
      type: "trash",
      title: "Trash",
      component: <Trash />,
      buttons: {
        search: {
          title: "Search trash"
        }
      }
    };
  },
  "/tags": () => {
    notestore.clearSearch();
    return {
      key: "tags",
      title: "Tags",
      type: "tags",
      component: <Tags />,
      buttons: {
        search: {
          title: "Search tags"
        }
      }
    };
  },
  "/tags/:tagId": ({ tagId }) => {
    const tag = db.tags.tag(tagId);
    if (!tag) return false;
    const { id } = tag;
    notestore.setContext({ type: "tag", value: id });
    const title = db.tags.alias(id);
    notestore.clearSearch();
    return {
      key: "notes",
      type: "notes",
      title: `#${title}`,
      component: <Notes type="notes" />,
      buttons: {
        back: {
          title: "Go back to tags",
          action: () => navigate("/tags")
        },
        search: {
          title: `Search #${title} notes`
        }
      }
    };
  },
  "/colors/:colorId": ({ colorId }) => {
    const color = db.colors.tag(colorId);
    if (!color) return navigate("/");
    const { id } = color;
    const title = db.colors.alias(id);
    notestore.setContext({ type: "color", value: id });
    notestore.clearSearch();
    return {
      key: "notes",
      type: "notes",
      title: title,
      component: <Notes />,
      buttons: {
        search: {
          title: `Search ${title} colored notes`
        }
      }
    };
  },
  "/settings": () => {
    notestore.clearSearch();
    return {
      key: "settings",
      title: "Settings",
      component: <Settings />
    };
  },
  "/monographs": () => {
    notestore.setContext({ type: "monographs" });
    notestore.clearSearch();
    return {
      key: "notes",
      title: "Monographs",
      type: "notes",
      component: <Notes />,
      buttons: {
        search: {
          title: "Search monograph notes"
        }
      }
    };
  },
  "/search/:type": ({ type }) => {
    return {
      type: "search",
      title: "Search",
      component: <Search type={type} />,
      buttons: {
        back: {
          title: `Go back to ${type}`,
          action: () => window.history.back()
        }
      }
    };
  }
};

export default routes;
