import React, { useEffect, useState } from "react";
import { Flex, Box, Text } from "rebass";
import * as Icon from "react-feather";
import { ButtonPressedStyle } from "../theme";
import Dropdown, {
  DropdownTrigger,
  DropdownContent
} from "react-simple-dropdown";
import TimeAgo from "timeago-react";
import "react-simple-dropdown/styles/Dropdown.css";
import { db, ev } from "../common";
import { Virtuoso as List } from "react-virtuoso";
import { showSnack } from "../components/snackbar";
import Menu from "../components/menu";
import Button from "../components/button";
import Search from "../components/search";

const dropdownRefs = [];
const menuItems = [
  { title: "Favorite", icon: Icon.Heart },
  { title: "Share", icon: Icon.Share2 },
  {
    title: "Delete",
    icon: Icon.Trash,
    color: "red",
    onClick: note => {
      db.deleteNotes([note]).then(
        //TODO implement undo
        async () => {
          showSnack("Note deleted!", Icon.Check);
          //TODO very crude but works.
          await Home.onRefresh();
        }
      );
    }
  }
];

function sendNewNoteEvent() {
  ev.emit("onNewNote");
}

function Home() {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    Home.onRefresh = async () => {
      setNotes(await db.getNotes());
    };
    Home.onRefresh();
    return () => {
      Home.onRefresh = undefined;
    };
  }, []);
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Search placeholder="Search" />
      <Button
        Icon={Icon.Plus}
        content="Make a new note"
        onClick={sendNewNoteEvent}
      />
      <List
        style={{ width: "100%", flex: "1 1 auto", height: "auto" }}
        totalCount={notes.length}
        item={index => {
          const note = notes[index];
          return (
            <Box
              bg="navbg"
              px={3}
              py={3}
              sx={{
                borderRadius: "default",
                marginBottom: 2,
                ...ButtonPressedStyle
              }}
            >
              <Flex flexDirection="row" justifyContent="space-between">
                <Text fontFamily="body" fontSize="title" fontWeight="bold">
                  {note.title}
                </Text>
                <Dropdown ref={ref => (dropdownRefs[index] = ref)}>
                  <DropdownTrigger>
                    <Icon.MoreVertical
                      size={20}
                      strokeWidth={1.5}
                      style={{ marginRight: -5 }}
                    />
                  </DropdownTrigger>
                  <DropdownContent style={{ zIndex: 999, marginLeft: -70 }}>
                    <Menu
                      dropdownRef={dropdownRefs[index]}
                      menuItems={menuItems}
                      data={note}
                    />
                  </DropdownContent>
                </Dropdown>
              </Flex>
              <Text fontFamily="body" fontSize="body" sx={{ marginTop: 1 }}>
                {note.headline}
              </Text>
              <Text
                fontFamily="body"
                fontWeight="body"
                fontSize={12}
                color="accent"
              >
                <TimeAgo datetime={note.dateCreated} />
              </Text>
            </Box>
          );
        }}
      />
    </Flex>
  );
}

export default Home;
