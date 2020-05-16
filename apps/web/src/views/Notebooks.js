import React, { useState, useEffect } from "react";
import Notebook from "../components/notebook";
import AddNotebookDialog from "../components/dialogs/addnotebookdialog";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/notebook-store";
import NotebooksPlaceholder from "../components/placeholders/notebooks-placeholder";
import { db } from "../common";

function Notebooks(props) {
  const [open, setOpen] = useState(false);
  useEffect(() => store.refresh(), []);
  const notebooks = useStore((state) => state.notebooks);
  const add = useStore((state) => state.add);

  useEffect(() => {
    if (props.id) {
      const notebook = db.notebooks.notebook(props.id);
      if (props.topic) {
        props.navigator.navigate("notes", {
          title: notebook.title,
          subtitle: props.topic,
          context: {
            type: "topic",
            value: { id: props.id, topic: props.topic },
          },
        });
      } else {
        props.navigator.navigate("topics", {
          title: notebook.title,
          topics: notebook.data.topics,
          notebook: notebook.data,
        });
      }
    }
  }, [props.id, props.topic, props.navigator]);

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
              props.navigator.navigate("topics", {
                title: item.title,
                topics: item.topics,
                notebook: item,
              });
            }}
            onTopicClick={(notebook, topic) =>
              props.navigator.navigate("notes", {
                title: notebook.title,
                subtitle: topic.title,
                context: {
                  type: "topic",
                  value: { id: notebook.id, topic: topic.title },
                },
              })
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

/* function NotebooksContainer() {
  return (
    <NavigationContainer
      variant="columnFill"
      navigator={require("../navigation/navigators/nbnavigator").default}
    />
  );
} */

export default Notebooks;
