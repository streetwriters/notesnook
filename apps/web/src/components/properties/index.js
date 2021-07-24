import React, { useCallback, useEffect, useState } from "react";
import * as Icon from "../icons";
import { Flex, Text, Button } from "rebass";
import { useStore } from "../../stores/editor-store";
import { COLORS } from "../../common";
import { db } from "../../common/db";
import { objectMap } from "../../utils/object";
import { useStore as useAppStore } from "../../stores/app-store";
import Animated from "../animated";
import Toggle from "./toggle";
import { toTitleCase } from "../../utils/string";
import { showMoveNoteDialog } from "../../common/dialog-controller";
import { navigate } from "../../navigation";

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
  const color = useStore((store) => store.session.color);
  const toggleLocked = useStore((store) => store.toggleLocked);
  const sessionId = useStore((store) => store.session.id);
  const notebooks = useStore((store) => store.session.notebooks);
  const setSession = useStore((store) => store.setSession);
  const setColor = useStore((store) => store.setColor);
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

  return (
    !isFocusMode && (
      <>
        <Animated.Flex
          animate={{
            x: arePropertiesVisible ? 0 : 800,
            display: arePropertiesVisible ? "flex" : "none",
          }}
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
            zIndex: 3,
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
                data-test-id="properties-close"
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
            {sessionId ? (
              <>
                <Flex>
                  {tools.map((tool, _) => (
                    <Toggle
                      {...tool}
                      key={tool.key}
                      toggleKey={tool.key}
                      onToggle={(state) => changeState(tool.key, state)}
                      testId={`properties-${tool.key}`}
                    />
                  ))}
                </Flex>
                <Flex flexDirection="column">
                  {objectMap(COLORS, (label, code) => (
                    <Flex
                      key={label}
                      justifyContent="space-between"
                      alignItems="center"
                      onClick={() => setColor(label)}
                      sx={{ cursor: "pointer" }}
                      mt={4}
                      data-test-id={`properties-${label}`}
                    >
                      <Flex key={label} alignItems="center">
                        <Icon.Circle size={14} color={code} />
                        <Text ml={1} color="text" variant="body">
                          {toTitleCase(label)}
                        </Text>
                      </Flex>
                      {color === label && (
                        <Icon.Checkmark
                          color="primary"
                          size={20}
                          data-test-id={`properties-${label}-check`}
                        />
                      )}
                    </Flex>
                  ))}
                </Flex>
                {notebooks?.length && (
                  <>
                    <Text variant="subtitle" mt={4} mb={1}>
                      Referenced in {notebooks.length} notebook(s):
                    </Text>
                    {notebooks.map((ref) => {
                      const notebook = db.notebooks.notebook(ref.id);
                      if (!notebook) return null;
                      const topics = ref.topics.map(
                        (topicId) => notebook.topics.topic(topicId)._topic
                      );
                      return (
                        <Flex flexDirection="column" my={1}>
                          <Flex
                            onClick={() => {
                              navigate(`/notebooks/${notebook.data.id}`);
                            }}
                            mb={1}
                          >
                            <Icon.Notebook size={12} />
                            <Text
                              variant="body"
                              ml={1}
                              sx={{ cursor: "pointer" }}
                            >
                              {notebook.title}
                            </Text>
                          </Flex>
                          {topics.map((topic) => (
                            <Flex
                              mb={1}
                              ml={2}
                              onClick={() => {
                                navigate(
                                  `/notebooks/${notebook.data.id}/${topic.id}`
                                );
                              }}
                            >
                              <Icon.Topic size={12} />
                              <Text
                                variant="body"
                                ml={1}
                                sx={{ cursor: "pointer" }}
                              >
                                {topic.title}
                              </Text>
                            </Flex>
                          ))}
                        </Flex>
                      );
                    })}
                  </>
                )}
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await showMoveNoteDialog([sessionId]);
                  }}
                  data-test-id="properties-add-to-nb"
                  mt={notebooks?.length ? 0 : 3}
                >
                  Add to notebook
                </Button>
              </>
            ) : (
              <Text
                variant="body"
                sx={{ justifySelf: "center", alignSelf: "center" }}
              >
                Start writing to make a new note.
              </Text>
            )}
          </Flex>
        </Animated.Flex>
      </>
    )
  );
}
export default React.memo(Properties);
