import React, { useEffect } from "react";
import { Flex, Text, Box } from "rebass";
import * as Icon from "react-feather";
import { db } from "../common";
import { GroupedVirtuoso as GroupList } from "react-virtuoso";
import Button from "../components/button";
import Search from "../components/search";
import Note from "../components/note";
import { useStore, store } from "../stores/note-store";
import { useStore as useEditorStore } from "../stores/editor-store";
import ListContainer from "../components/list-container";
import NotesPlaceholder from "../components/placeholders/notesplacholder";

function SearchBox(props) {
  return (
    <Search
      placeholder="Search"
      onChange={e => {
        let data =
          e.target.value.length > 2
            ? db.notes.filter(e.target.value)
            : db.notes.group(undefined, true);
        data = !data ? [] : data;
        props.setNotes(data);
      }}
    />
  );
}

function Home() {
  useEffect(() => store.getState().refresh(), []);
  const notes = useStore(store => store.notes);
  const newSession = useEditorStore(store => store.newSession);
  return (
    <ListContainer
      itemsLength={notes.items.length}
      placeholder={NotesPlaceholder}
      searchPlaceholder={"Search your notes"}
      button={{ content: "Make a new note", onClick: () => newSession() }}
    >
      <GroupList
        style={{
          width: "100%",
          flex: "1 1 auto",
          height: "auto",
          overflowX: "hidden"
        }}
        groupCounts={notes.groupCounts}
        group={groupIndex =>
          notes.groups[groupIndex].title === "Pinned" ? (
            <Box px={2} bg="background" py={1} />
          ) : (
            <Box
              mx={2}
              bg="background"
              py={2}
              sx={{
                borderBottom: "1px solid",
                borderBottomColor: "primary",
                marginBottom: 2
              }}
            >
              <Text variant="heading" color="primary" fontSize="subtitle">
                {notes.groups[groupIndex].title}
              </Text>
            </Box>
          )
        }
        item={(index, groupIndex) =>
          notes.groupCounts[groupIndex] && (
            <Note
              index={index}
              pinnable={true}
              groupIndex={groupIndex}
              item={notes.items[index]}
            />
          )
        }
      />
    </ListContainer>
  );
}
export default Home;
