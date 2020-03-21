import React from "react";
import * as Icon from "../icons";
import { Box, Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import CheckBox from "../checkbox";
import { useStore } from "../../stores/editor-store";
import { COLORS } from "../../common";
import { objectMap } from "../../utils/object";
import { useStore as useAppStore } from "../../stores/app-store";
import { motion } from "framer-motion";

const Properties = props => {
  const pinned = useStore(store => store.session.pinned);
  const favorite = useStore(store => store.session.favorite);
  const locked = useStore(store => store.session.locked);
  const colors = useStore(store => store.session.colors);
  const tags = useStore(store => store.session.tags);

  const setSession = useStore(store => store.setSession);
  const setColor = useStore(store => store.setColor);
  const setTag = useStore(store => store.setTag);
  const toggleLocked = useStore(store => store.toggleLocked);
  const hideProperties = useAppStore(store => store.hideProperties);
  const showProperties = useAppStore(store => store.showProperties);
  const arePropertiesVisible = useAppStore(store => store.arePropertiesVisible);
  const isFocusModeEnabled = useAppStore(store => store.isFocusModeEnabled);

  function changeState(prop, value) {
    setSession(state => {
      state.session[prop] = value;
    });
  }

  return (
    !isFocusModeEnabled && (
      <>
        <Box
          onClick={() => showProperties()}
          sx={{
            display: arePropertiesVisible ? "none" : "flex",
            position: "absolute",
            top: "50%",
            right: 0,
            color: "static",
            borderRadius: "100px 0px 0px 100px",
            cursor: "pointer",
            height: [0, 0, 60]
          }}
          alignItems="center"
          justifyContent="center"
          bg="primary"
        >
          <Icon.ChevronLeft color="static" size={32} />
        </Box>

        <motion.div
          animate={{ x: arePropertiesVisible ? 0 : 800 }}
          transition={{
            duration: 0.5,
            bounceDamping: 1,
            bounceStiffness: 1,
            ease: "easeOut"
          }}
          initial={false}
          style={{
            position: "absolute",
            right: 0,
            display: "flex",
            width: 300,
            height: "100%"
          }}
        >
          <Box
            sx={{
              position: "absolute",
              right: 0,
              overflowY: "auto",
              overflowX: "hidden",
              display: "flex",
              width: [0, 0, "100%"],
              height: "100%",
              boxShadow: "-1px 1px 10px 0px #88888890"
            }}
            flexDirection="column"
            bg="background"
            px={3}
            py={0}
          >
            <Text
              variant="title"
              color="primary"
              my={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ display: "flex" }}
            >
              Properties
              <Text
                as="span"
                onClick={() => hideProperties()}
                sx={{
                  color: "red",
                  height: 24,
                  ":active": { color: "darkRed" }
                }}
              >
                <Icon.Close />
              </Text>
            </Text>
            <CheckBox
              checked={pinned}
              icon={Icon.Pin}
              label="Pin"
              onChecked={state => changeState("pinned", state)}
            />
            <CheckBox
              icon={Icon.Star}
              checked={favorite}
              label="Favorite"
              onChecked={state => changeState("favorite", state)}
            />
            <CheckBox
              icon={Icon.Lock}
              label="Lock"
              checked={locked}
              onClick={toggleLocked}
            />
            <Flex fontSize="body" sx={{ marginBottom: 3 }} alignItems="center">
              <Icon.Notebook size={18} />
              <Text sx={{ marginLeft: 1 }}>Move to notebook</Text>
            </Flex>
            <Flex fontSize="body" sx={{ marginBottom: 2 }} alignItems="center">
              <Icon.Tag size={18} />
              <Text sx={{ marginLeft: 1 }}>Tags:</Text>
            </Flex>
            <Input
              variant="default"
              placeholder="#tag"
              sx={{ marginBottom: 2 }}
              onKeyUp={event => {
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
              sx={{ marginBottom: 2 }}
              alignItems="center"
              justifyContent="flex-start"
              flexWrap="wrap"
            >
              {tags.map(tag => (
                <Text
                  key={tag}
                  sx={{
                    backgroundColor: "primary",
                    color: "static",
                    borderRadius: "default",
                    padding: "2px 5px 2px 5px",
                    marginBottom: 1,
                    marginRight: 1,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    setTag(tag);
                  }}
                >
                  #{tag}
                </Text>
              ))}
            </Flex>
            <Flex fontSize="body" sx={{ marginBottom: 2 }} alignItems="center">
              <Icon.Color size={18} />
              <Text sx={{ marginLeft: 1 }}>Colors:</Text>
            </Flex>
            <Flex flexWrap="wrap" sx={{ marginBottom: 2 }}>
              {objectMap(COLORS, (label, code) => (
                <Flex
                  sx={{ position: "relative" }}
                  justifyContent="center"
                  alignItems="center"
                  onClick={() => setColor(label)}
                  key={label}
                >
                  <Icon.Circle
                    size={40}
                    style={{ cursor: "pointer" }}
                    color={code}
                    strokeWidth={0}
                  />
                  {colors.includes(label) && (
                    <Icon.Check
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        color: "white"
                      }}
                      size={20}
                    />
                  )}
                </Flex>
              ))}
            </Flex>
          </Box>
        </motion.div>
      </>
    )
  );
};

export default React.memo(Properties);
