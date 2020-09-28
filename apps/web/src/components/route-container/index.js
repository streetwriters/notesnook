import React from "react";
import Animated from "../animated";
import { Box, Flex, Heading, Text } from "rebass";
import * as Icon from "../icons";
import { useStore } from "../../stores/app-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { SELECTION_OPTIONS_MAP } from "../../common";

function RouteContainer(props) {
  const { type, route, canGoBack, title, subtitle, onlyBackButton } = props;
  return (
    <Animated.Flex
      sx={{ overflow: "hidden" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeIn" }}
      exit={{ opacity: 0 }}
      flexDirection="column"
      flex="1 1 auto"
    >
      <Header
        canGoBack={canGoBack}
        title={title}
        subtitle={subtitle}
        onlyBackButton={onlyBackButton}
        selectionOptions={SELECTION_OPTIONS_MAP[type]}
      />
      {route}
    </Animated.Flex>
  );
}

export default RouteContainer;

function Header(props) {
  const {
    title,
    subtitle,
    canGoBack,
    selectionOptions,
    onlyBackButton,
  } = props;

  const toggleSideMenu = useStore((store) => store.toggleSideMenu);

  if (!onlyBackButton && !title && !subtitle) return null;
  return (
    <Flex mx={2} flexDirection="column">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" py={2}>
          {canGoBack || onlyBackButton ? (
            <Box
              onClick={() => window.history.back()}
              ml={-2}
              height={38}
              width={38}
            >
              <Icon.ChevronLeft
                size={38}
                color="fontPrimary"
                data-test-id="go-back"
              />
            </Box>
          ) : (
            <Icon.Menu
              onClick={toggleSideMenu}
              sx={{
                ml: 0,
                mr: 4,
                display: [onlyBackButton ? "none" : "block", "none", "none"],
              }}
              size={28}
            />
          )}
          <Icon.Menu
            onClick={toggleSideMenu}
            sx={{
              ml: 0,
              mr: 4,
              display: ["block", "none", "none"],
            }}
            size={28}
          />
          <Heading data-test-id="routeHeader" fontSize="heading" color={"text"}>
            {title}
          </Heading>
        </Flex>
        <SelectionOptions options={selectionOptions} />
      </Flex>
      {subtitle && (
        <Text
          variant="title"
          color="primary"
          sx={{
            marginBottom: 2,
            cursor: "normal",
          }}
        >
          {subtitle}
        </Text>
      )}
      <SelectionBox />
    </Flex>
  );
}

function SelectionOptions(props) {
  const { options } = props;

  const isSelectionMode = useSelectionStore((store) => store.isSelectionMode);

  if (!isSelectionMode || !options) return null;
  return (
    <Flex>
      {options.map((option) => (
        <Box
          key={option.key}
          onClick={option.onClick}
          mx={2}
          sx={{ cursor: "pointer" }}
        >
          <option.icon />
        </Box>
      ))}
    </Flex>
  );
}

function SelectionBox() {
  const toggleSelectionMode = useSelectionStore(
    (store) => store.toggleSelectionMode
  );
  const selectAll = useSelectionStore((store) => store.selectAll);
  const shouldSelectAll = useSelectionStore((store) => store.shouldSelectAll);
  const isSelectionMode = useSelectionStore((store) => store.isSelectionMode);

  if (!isSelectionMode) return null;
  return (
    <Flex
      alignItems="center"
      mb={2}
      sx={{ cursor: "pointer" }}
      onClick={() => {
        if (shouldSelectAll) {
          toggleSelectionMode(false);
        } else {
          selectAll();
        }
      }}
    >
      {shouldSelectAll ? <Icon.Check /> : <Icon.CircleEmpty />}
      <Text ml={1} variant="title" color="primary">
        {shouldSelectAll ? "Unselect all" : "Select all"}
      </Text>
    </Flex>
  );
}
