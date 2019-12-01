import React, { useEffect, useState } from "react";
import { Flex, Box, Text, Heading } from "rebass";
import * as Icon from "react-feather";
import { SHADOW } from "../theme";
import { Input } from "@rebass/forms";
import Dropdown, {
  DropdownTrigger,
  DropdownContent
} from "react-simple-dropdown";
import TimeAgo from "timeago-react";
import "react-simple-dropdown/styles/Dropdown.css";
import { db, ev } from "../common";
import { Virtuoso as List } from "react-virtuoso";
import AutoSizer from "react-virtualized-auto-sizer";
import { showSnack } from "../components/snackbar";

const menuItems = [
  { title: "Favorite", icon: Icon.Heart },
  { title: "Share", icon: Icon.Share2 },
  { title: "Delete", icon: Icon.Trash, color: "red" }
];
let notesMenu = undefined;

function sendNewNoteEvent() {
  showSnack("Let's start writing!", Icon.Edit2);
  ev.emit("onNewNote");
}

//TODO make this generic
function NoteMenu() {
  return (
    <Flex
      bg="primary"
      py={1}
      sx={{ borderRadius: "default", boxShadow: SHADOW }}
    >
      <Box>
        {menuItems.map(v => (
          <Flex
            key={v.title}
            onClick={() => notesMenu.hide()}
            flexDirection="row"
            alignItems="center"
            py={1}
            px={2}
            sx={{
              color: v.color || "fontPrimary",
              ":hover": {
                backgroundColor: "accent",
                color: "fontSecondary"
              }
            }}
          >
            <v.icon size={15} strokeWidth={1.5} />
            <Text
              className="unselectable"
              as="span"
              mx={1}
              fontFamily="body"
              fontSize="menu"
            >
              {v.title}
            </Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
}

function Home() {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    (async () => setNotes(await db.getNotes()))();
  }, []);
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Input
        placeholder="Search"
        fontFamily="body"
        fontWeight="body"
        fontSize="input"
        bg="navbg"
        my={2}
        px={3}
        py={3}
        sx={{
          boxShadow: SHADOW,
          borderWidth: 0,
          borderRadius: "default"
        }}
      />
      <Flex
        bg="accent"
        width="full"
        py={3}
        px={3}
        flexDirection="row"
        alignItems="center"
        sx={{
          borderRadius: "default",
          marginBottom: 2,
          color: "fontSecondary",
          fontFamily: "body",
          fontWeight: "body",
          ":active": {
            opacity: "0.8"
          }
        }}
        onClick={() => sendNewNoteEvent()}
      >
        <Icon.Plus />
        <Text className="unselectable" mx={1}>
          Make a new note
        </Text>
      </Flex>
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
              sx={{ borderRadius: "default", marginBottom: 2 }}
            >
              <Flex flexDirection="row" justifyContent="space-between">
                <Text fontFamily="body" fontSize="title" fontWeight="bold">
                  {note.title}
                </Text>
                <Dropdown ref={ref => (notesMenu = ref)}>
                  <DropdownTrigger>
                    <Icon.MoreVertical
                      size={20}
                      strokeWidth={1.5}
                      style={{ marginRight: -5 }}
                    />
                  </DropdownTrigger>
                  <DropdownContent style={{ zIndex: 999, marginLeft: -70 }}>
                    <NoteMenu />
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
