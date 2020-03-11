import React, { useEffect } from "react";
import { Text, Box } from "rebass";
import { GroupedVirtuoso as GroupList } from "react-virtuoso";
import Note from "../components/note";
import { useStore, store } from "../stores/note-store";
import { useStore as useEditorStore } from "../stores/editor-store";
import ListContainer from "../components/list-container";
import NotesPlaceholder from "../components/placeholders/notesplacholder";

function Home(props) {
  useEffect(() => store.getState().refresh(), []);
  const notes = useStore(store => store.notes);
  const newSession = useEditorStore(store => store.newSession);
  return (
    <ListContainer
      term={props.term}
      itemsLength={notes.items.length}
      placeholder={NotesPlaceholder}
      searchPlaceholder={"Search your notes"}
      button={{ content: "Make a new note", onClick: () => newSession() }}
      searchParams={{
        items: notes.items,
        type: "notes",
        item: (index, item) => (
          <Note index={index} pinnable={false} item={item} />
        )
      }}
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
