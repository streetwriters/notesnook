import React from "react";
import Note from "../components/note";
import ListContainer from "../components/list-container";
import { useStore } from "../stores/editor-store";

const Notes = props => {
  const newSession = useStore(store => store.newSession);
  return (
    <ListContainer
      item={index => <Note index={index} item={props.notes[index]} />}
      itemsLength={props.notes.length}
      button={{
        content: "Make a new note",
        onClick: () =>
          newSession({
            colors: [],
            tags: [],
            notebook: {},
            ...props.context
          })
      }}
    />
  );
};

export default Notes;
