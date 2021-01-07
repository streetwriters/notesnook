import React from "react";
import { db } from "../common";
import FavoritesPlaceholder from "../components/placeholders/favorites-placeholder";
import RouteContainer from "../components/route-container";
import { toTitleCase } from "../utils/string";
import Home from "../views/home";
import Notebooks from "../views/notebooks";
import Notes from "../views/notes.js";
import Search from "../views/search";
import Settings from "../views/settings";
import Tags from "../views/tags";
import Topics from "../views/topics";
import { navigate } from "../navigation";
import Trash from "../views/trash";

const routes = {
  "/": () => <RouteContainer type="notes" title="Notes" route={<Home />} />,
  "/notebooks": () => (
    <RouteContainer type="notebooks" title="Notebooks" route={<Notebooks />} />
  ),
  "/notebooks/:notebook": ({ notebook }) => {
    const nbItem = db.notebooks.notebook(notebook);
    if (!nbItem) return;
    return (
      <RouteContainer
        type="topics"
        title={nbItem.title}
        canGoBack
        route={<Topics notebookId={notebook} />}
      />
    );
  },
  "/notebooks/:notebook/:topic": ({ notebook, topic }) => {
    const nb = db.notebooks.notebook(notebook);
    const topicItem = nb.topics.topic(topic)._topic;
    if (!topicItem) return navigate(`/notebooks/${nb.id}`);

    return (
      <RouteContainer
        type="notes"
        title={nb.title}
        canGoBack
        subtitle={topicItem.title}
        route={
          <Notes
            context={{
              type: "topic",
              value: { id: notebook, topic: topic },
            }}
          />
        }
      />
    );
  },
  "/favorites": () => (
    <RouteContainer
      title="Favorites"
      type="favorites"
      route={
        <Notes
          placeholder={FavoritesPlaceholder}
          context={{ type: "favorites" }}
        />
      }
    />
  ),
  "/trash": () => (
    <RouteContainer type="trash" title="Trash" route={<Trash />} />
  ),
  "/tags": () => <RouteContainer title="Tags" type="tags" route={<Tags />} />,
  "/tags/:tag": ({ tag }) => {
    const tagItem = db.tags.tag(tag);
    if (!tagItem) return navigate("/");
    const { title } = tagItem;
    return (
      <RouteContainer
        type="notes"
        canGoBack
        title={`#${title}`}
        route={
          <Notes type="notes" context={{ type: "tag", value: tagItem.id }} />
        }
      />
    );
  },
  "/colors/:color": ({ color }) => {
    const colorItem = db.colors.tag(color);
    if (!colorItem) return navigate("/");
    const { title } = colorItem;
    return (
      <RouteContainer
        type="notes"
        title={toTitleCase(title)}
        route={<Notes context={{ type: "color", value: color }} />}
      />
    );
  },
  "/settings": () => <RouteContainer title="Settings" route={<Settings />} />,
  "/search": () => (
    <RouteContainer type="search" canGoBack title="Search" route={<Search />} />
  ),
};

export default routes;
