import React, { useEffect } from "react";
import { showAddNotebookDialog } from "../components/dialogs/addnotebookdialog";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/notebook-store";
import NotebooksPlaceholder from "../components/placeholders/notebooks-placeholder";
import Topics from "./topics.js";
import Notes from "./notes.js";
import { useRoutes, navigate } from "hookrouter";
import RouteContainer from "../components/route-container";
import { db } from "../common";

const routes = {
  "/": () => (
    <RouteContainer type="notebooks" title="Notebooks" route={<Notebooks />} />
  ),
  "/:notebook": ({ notebook }) => {
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
  "/:notebook/:topic": ({ notebook, topic }) => {
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
};

function NotebooksContainer() {
  const routeResult = useRoutes(routes);
  return routeResult;
}

function Notebooks() {
  useEffect(() => store.refresh(), []);
  const notebooks = useStore((state) => state.notebooks);

  return (
    <>
      <ListContainer
        type="notebooks"
        items={notebooks}
        placeholder={NotebooksPlaceholder}
        button={{
          content: "Create a notebook",
          onClick: showAddNotebookDialog,
        }}
      />
    </>
  );
}

export default NotebooksContainer;
