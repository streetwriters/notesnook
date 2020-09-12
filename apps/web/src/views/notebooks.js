import React, { useState, useEffect } from "react";
import Notebook from "../components/notebook";
import AddNotebookDialog from "../components/dialogs/addnotebookdialog";
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
  "/:notebook": ({ notebook }) => (
    <RouteContainer
      type="topics"
      title={db.notebooks.notebook(notebook).title}
      canGoBack
      route={<Topics notebookId={notebook} />}
    />
  ),
  "/:notebook/:topic": ({ notebook, topic }) => {
    const nb = db.notebooks.notebook(notebook);
    const topicItem = nb.topics.all[topic];
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
              value: { id: notebook, topic: topicItem.title },
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

function Notebooks(props) {
  const [open, setOpen] = useState(false);
  useEffect(() => store.refresh(), []);
  const notebooks = useStore((state) => state.notebooks);
  const add = useStore((state) => state.add);

  return (
    <>
      <ListContainer
        type="notebooks"
        items={notebooks}
        item={(index, item) => (
          <Notebook
            index={index}
            item={item}
            onClick={() => {
              navigate(`/notebooks/${item.id}`);
            }}
            onTopicClick={(notebook, topic) =>
              navigate(`/notebooks/${notebook.id}/${topic}`)
            }
          />
        )}
        placeholder={NotebooksPlaceholder}
        button={{
          content: "Create a notebook",
          onClick: async () => {
            setOpen(true);
          },
        }}
      />
      <AddNotebookDialog
        isOpen={open}
        onDone={async (nb) => {
          await add(nb);
          setOpen(false);
        }}
        close={() => {
          setOpen(false);
        }}
      />
    </>
  );
}

export default NotebooksContainer;
