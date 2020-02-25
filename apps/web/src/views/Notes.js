import React from "react";
import * as Icon from "react-feather";
import Note from "../components/note";
import { sendNewNoteEvent } from "../common";
import ListContainer from "../components/list-container";

const Notes = props => {
  return (
    <ListContainer
      item={index => <Note index={index} item={props.notes[index]} />}
      itemsLength={props.notes.length}
      button={{
        content: "Make a new note",
        onClick: () =>
          sendNewNoteEvent({
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
