import React from "react";
import Note from "../components/note";
import ListContainer from "../components/list-container";

const Notes = props => {
  return (
    <ListContainer
      item={index => <Note index={index} item={props.notes[index]} />}
      itemsLength={props.notes.length}
      button={{
        content: "Make a new note",
        onClick: () => {}
        /* sendNewNoteEvent({
            colors: [],
            tags: [],
            notebook: {},
            ...props.context
          }) */
      }}
    />
  );
};

export default Notes;
