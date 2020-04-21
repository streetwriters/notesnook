import React from "react";
import { Box, Flex, Heading, Text } from "rebass";
import * as Icon from "../components/icons";
import ThemeProvider from "../components/theme-provider";
import { useStore } from "../stores/app-store";
import { useStore as useSelectionStore } from "../stores/selection-store";

function Route(props) {
  const navigator = props.params.navigator || props.navigator;

  return (
    <ThemeProvider>
      <Flex flexDirection="column" px={2}>
        <Header {...props} />
      </Flex>
      {props.route.component && (
        <props.route.component navigator={navigator} {...props.params} />
      )}
    </ThemeProvider>
  );
}
export default Route;

function Header(props) {
  const { route, canGoBack, backAction } = props;
  const { title, titleColor, params, options } = route;

  const toggleSideMenu = useStore((store) => store.toggleSideMenu);

  if (!title && !params.title) return null;
  return (
    <>
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" py={2}>
          {canGoBack && (
            <Box onClick={backAction} ml={-2} height={38} width={38}>
              <Icon.ChevronLeft size={38} color="fontPrimary" />
            </Box>
          )}
          <Box
            onClick={toggleSideMenu}
            height={38}
            ml={-5}
            sx={{
              display: ["block", "none", "none"],
            }}
          >
            <Icon.Menu size={38} />
          </Box>
          <Heading fontSize="heading" color={titleColor || "text"}>
            {title || params.title}
          </Heading>
        </Flex>
        <SelectionOptions options={options} />
      </Flex>
      {params.subtitle && (
        <Text
          variant="title"
          color="primary"
          sx={{
            marginBottom: 2,
            cursor: "normal",
          }}
        >
          {params.subtitle}
        </Text>
      )}
      <SelectionBox />
    </>
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
