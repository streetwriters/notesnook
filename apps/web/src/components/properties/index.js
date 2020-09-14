import React, { useCallback, useEffect, useState } from "react";
import * as Icon from "../icons";
import { Flex, Text, Button } from "rebass";
import { Input } from "@rebass/forms";
import { useStore } from "../../stores/editor-store";
import { COLORS, db } from "../../common";
import { objectMap } from "../../utils/object";
import { useStore as useAppStore } from "../../stores/app-store";
import Animated from "../animated";
import Toggle from "./toggle";
import { toTitleCase } from "../../utils/string";
import { showMoveNoteDialog } from "../dialogs/movenotedialog";
import { navigate } from "hookrouter";

const tools = [
  { key: "pinned", icons: { on: Icon.PinFilled, off: Icon.Pin }, label: "Pin" },
  {
    key: "favorite",
    icons: { on: Icon.Star, off: Icon.StarOutline },
    label: "Favorite",
  },
  { key: "locked", icons: { on: Icon.Lock, off: Icon.Unlock }, label: "Lock" },
];

function Properties() {
  const [notebook, setNotebook] = useState();
  const colors = useStore((store) => store.session.colors);
  const toggleLocked = useStore((store) => store.toggleLocked);
  const tags = useStore((store) => store.session.tags);
  const sessionId = useStore((store) => store.session.id);
  const notebookData = useStore((store) => store.session.notebook);
  const setSession = useStore((store) => store.setSession);
  const setColor = useStore((store) => store.setColor);
  const setTag = useStore((store) => store.setTag);
  const arePropertiesVisible = useStore((store) => store.arePropertiesVisible);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);

  const changeState = useCallback(
    function changeState(prop, value) {
      if (prop === "locked") {
        toggleLocked();
        return;
      }
      setSession((state) => {
        state.session[prop] = value;
      });
    },
    [setSession, toggleLocked]
  );

  useEffect(() => {
    if (notebookData && notebookData.id) {
      setNotebook(db.notebooks.notebook(notebookData.id).data);
    }
  }, [notebookData]);

  return (
    !isFocusMode && (
      <>
        <Animated.Flex
          animate={{ x: arePropertiesVisible ? 0 : 800 }}
          transition={{
            duration: 0.3,
            bounceDamping: 1,
            bounceStiffness: 1,
            ease: "easeOut",
          }}
          initial={false}
          style={{
            position: "absolute",
            right: 0,
            height: "100%",
          }}
        >
          <Flex
            sx={{
              overflowY: "auto",
              overflowX: "hidden",
              height: "100%",
              width: "300px",
              borderLeft: "1px solid",
              borderLeftColor: "border",
            }}
            flexDirection="column"
            bg="background"
            px={3}
            py={0}
          >
            <Text
              variant="title"
              my={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ display: "flex" }}
            >
              Properties
              <Text
                as="span"
                onClick={() => toggleProperties()}
                sx={{
                  color: "red",
                  height: 24,
                  ":active": { color: "darkRed" },
                }}
              >
                <Icon.Close />
              </Text>
            </Text>
            <Flex mb={1}>
              {tools.map((tool, _) => (
                <Toggle
                  {...tool}
                  key={tool.key}
                  toggleKey={tool.key}
                  onToggle={(state) => changeState(tool.key, state)}
                />
              ))}
            </Flex>
            <Button
              color="static"
              onClick={async () => {
                await showMoveNoteDialog([sessionId]);
              }}
            >
              {notebook ? "Move to another notebook" : "Add to notebook"}
            </Button>
            {notebook && (
              <Text as="span" variant="subBody" mt={1}>
                In{" "}
                <Text
                  as="span"
                  color="primary"
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    navigate(`/notebooks/${notebookData.id}`);
                    /* RootNavigator.navigate(
                      "notebooks",
                      { params: { id: notebookData.id } },
                      true
                    ); */
                  }}
                >
                  {notebook.title}
                </Text>{" "}
                under{" "}
                <Text
                  as="span"
                  color="primary"
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    const index = notebook.topics.findIndex(
                      (t) => t.title === notebookData.topic
                    );
                    navigate(`/notebooks/${notebookData.id}/${index}`);
                  }}
                >
                  {notebookData.topic}
                </Text>
              </Text>
            )}
            <Flex flexDirection="column">
              {objectMap(COLORS, (label, code) => (
                <Flex
                  key={label}
                  justifyContent="space-between"
                  alignItems="center"
                  onClick={() => setColor(label)}
                  sx={{ cursor: "pointer" }}
                  mt={4}
                >
                  <Flex key={label}>
                    <Icon.Circle size={24} color={code} />
                    <Text ml={1} color="text" variant="body">
                      {toTitleCase(label)}
                    </Text>
                  </Flex>
                  {colors.includes(label) && (
                    <Icon.Checkmark color="primary" size={20} />
                  )}
                </Flex>
              ))}
            </Flex>

            <Input
              placeholder="#tag"
              mt={4}
              onKeyUp={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " " ||
                  event.key === ","
                ) {
                  const value = event.target.value;
                  if (value.trim().length === 0) {
                    event.target.value = "";
                    return;
                  }
                  setTag(value.trim().replace(",", ""));
                  event.target.value = "";
                }
              }}
            />
            <Flex
              fontSize="body"
              sx={{ marginTop: 2 }}
              alignItems="center"
              justifyContent="flex-start"
              flexWrap="wrap"
            >
              {tags.map((tag) => (
                <Text
                  key={tag}
                  sx={{
                    backgroundColor: "primary",
                    color: "static",
                    borderRadius: "default",
                    padding: "2px 5px 2px 5px",
                    marginBottom: 1,
                    marginRight: 1,
                    cursor: "pointer",
                  }}
                  fontSize={"subBody"}
                  onClick={() => {
                    setTag(tag);
                  }}
                >
                  #{tag}
                </Text>
              ))}
            </Flex>
          </Flex>
        </Animated.Flex>
      </>
    )
  );
}
export default React.memo(Properties);
