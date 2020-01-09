import React from "react";
import { Flex } from "rebass";
import Button from "../components/button";
import * as Icon from "react-feather";
import Search from "../components/search";
import { Virtuoso as List } from "react-virtuoso";
import Note from "../components/note";
import { sendNewNoteEvent } from "../common";

const Notes = props => {
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Search placeholder="Search" />
      <List
        style={{
          width: "100%",
          flex: "1 1 auto",
          height: "auto",
          overflowX: "hidden"
        }}
        totalCount={props.notes.length}
        item={index => <Note index={index} item={props.notes[index]} />}
      />
      <Button
        Icon={Icon.Plus}
        content="Make a new note"
        onClick={sendNewNoteEvent}
      />
    </Flex>
  );
};

export default Notes;
