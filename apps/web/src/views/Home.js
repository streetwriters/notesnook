import React, { useEffect, useState } from "react";
import { Flex, Text, Box } from "rebass";
import * as Icon from "react-feather";
import { db, sendNewNoteEvent } from "../common";
import { GroupedVirtuoso as GroupList } from "react-virtuoso";
import Button from "../components/button";
import Search from "../components/search";
import Note from "../components/note";
import { useStore, store } from "../stores/note-store";
import { useStore as useEditorStore } from "../stores/editor-store";

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
  useEffect(() => store.getState().init(), []);
  const notes = useStore(store => store.notes);
  const clearSession = useEditorStore(store => store.clearSession);
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <SearchBox />
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
            <Box px={2} bg="background">
              <Text variant="heading" color="primary" fontSize="subtitle">
                {notes.groups[groupIndex].title}
              </Text>
            </Box>
          )
        }
        item={(index, groupIndex) => (
          <Note
            index={index}
            groupIndex={groupIndex}
            item={notes.items[index]}
          />
        )}
      />
      <Button
        Icon={Icon.Plus}
        content="Make a new note"
        onClick={() => clearSession()}
      />
    </Flex>
  );
}
export default Home;
/* 
import { HomeAnim } from "./Placeholders";



function Home() {
  const [notes, setNotes] = useState({
    items: [],
    groupCounts: [],
    groups: []
  });

  //const [pinnedItems, setPinnedItems] = useState([]);
  useEffect(() => {
    function onRefreshNotes() {
      let groups = db.notes.group();
      console.log(groups);
      setNotes(groups);
    }
    onRefreshNotes();
    ev.addListener("refreshNotes", onRefreshNotes);
    return () => {
      ev.removeListener("refreshNotes", onRefreshNotes);
    };
  }, []);
  //TODO remove all these ternary operators (they are absolutely horrid).
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      {notes && (notes.length || (notes.items && notes.items.length)) ? (
        <Flex flexDirection="column" flex="1 1 auto">
          <SearchBox setNotes={setNotes} />
          {notes.items === undefined ? (
            <List
              style={{
                width: "100%",
                flex: "1 1 auto",
                height: "auto",
                overflowX: "hidden"
              }}
              totalCount={notes.length}
              item={index => <Note index={index} item={notes[index]} />}
            ></List>
          ) : (
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
                  <Box px={3} bg="background" py={1} />
                ) : (
                  <Box px={3} bg="background">
                    <Text variant="heading" color="primary" fontSize={15}>
                      {notes.groups[groupIndex].title}
                    </Text>
                  </Box>
                )
              }
              item={(index, groupIndex) => (
                <Note index={index} item={notes.items[index]} />
              )}
            />
          )}
          <Button
            Icon={Icon.Plus}
            content="Make a new note"
            onClick={sendNewNoteEvent}
          />
        </Flex>
      ) : (
        <Flex flexDirection="column" flex="1 1 auto">
          {notes.items === undefined && <SearchBox setNotes={setNotes} />}
          <Flex
            flex="1 1 auto"
            alignItems="center"
            justifyContent="center"
            color="#9b9b9b"
            flexDirection="column"
          >
            {notes.items === undefined ? (
              <Icon.Search size={72} strokeWidth={1.5} />
            ) : (
              // <Icon.Moon size={72} strokeWidth={1.5} />
              <>
                <HomeAnim marginB="-70px" marginR="60px" />
                <HomeAnim marginB="20px" />
              </>
            )}
            <Text variant="body">
              {notes.items === undefined
                ? "We found nothing for that query."
                : "Notes you write will appear here."}
            </Text>
            {notes.items !== undefined && (
              <Button
                Icon={Icon.Edit2}
                onClick={sendNewNoteEvent}
                content="Let's make some"
                style={{ marginTop: 2, textAlign: "center" }}
                width={"auto"}
              />
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}

export default Home;
 */
