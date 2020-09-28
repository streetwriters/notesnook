import React, { useEffect, useCallback } from "react";
import { Flex, Box, Text } from "rebass";
import * as Icon from "../icons";
import {
  store as selectionStore,
  useStore as useSelectionStore,
} from "../../stores/selection-store";

function selectMenuItem(isSelected, toggleSelection) {
  return {
    title: isSelected ? "Unselect" : "Select",
    onClick: () => {
      const selectionState = selectionStore.get();
      if (!selectionState.isSelectionMode) {
        selectionState.toggleSelectionMode();
        toggleSelection();
      } else {
        toggleSelection();
      }
    },
  };
}

const ItemSelector = ({ isSelected, toggleSelection }) => {
  return (
    <Box
      width={24}
      sx={{
        marginLeft: 0,
        marginRight: 1,
        color: "primary",
        cursor: "pointer",
      }}
      onClick={() => toggleSelection()}
    >
      {isSelected ? <Icon.Check color="primary" /> : <Icon.CircleEmpty />}
    </Box>
  );
};

function ListItem(props) {
  const isSelectionMode = useSelectionStore((store) => store.isSelectionMode);
  const selectedItems = useSelectionStore((store) => store.selectedItems);
  const isSelected =
    selectedItems.findIndex((item) => props.item.id === item.id) > -1;
  const selectItem = useSelectionStore((store) => store.selectItem);

  const toggleSelection = useCallback(
    function toggleSelection() {
      selectItem(props.item);
    },
    [selectItem, props.item]
  );

  useEffect(() => {
    if (!isSelectionMode && isSelected) toggleSelection();
  }, [isSelectionMode, toggleSelection, isSelected]);

  const openContextMenu = useCallback(
    (event, withClick) => {
      let items = props.menuItems;
      if (props.selectable)
        items = [selectMenuItem(isSelected, toggleSelection), ...items];
      window.dispatchEvent(
        new CustomEvent("globalcontextmenu", {
          detail: {
            state: "open",
            items,
            data: props.menuData,
            internalEvent: event,
            withClick,
          },
        })
      );
    },
    [
      isSelected,
      props.menuData,
      props.menuItems,
      props.selectable,
      toggleSelection,
    ]
  );

  return (
    <Flex
      bg={props.pinned || isSelected ? "shade" : "background"}
      alignItems="center"
      onContextMenu={openContextMenu}
      p={2}
      justifyContent="space-between"
      sx={{
        height: "inherit",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        cursor: "pointer",
        position: "relative",
        ":hover": {
          borderBottomColor: "primary",
        },
      }}
      data-test-id={`${props.item.type}-${props.index}`}
    >
      {props.pinned && (
        <Flex
          variant="rowCenter"
          bg="primary"
          onClick={() => props.unpin && props.unpin()}
          sx={{
            position: "absolute",
            top: -15,
            right: 0,
            borderRadius: 35,
            width: 30,
            height: 30,
            boxShadow: "2px 1px 3px #00000066",
          }}
          mx={2}
        >
          <Box
            bg="static"
            sx={{
              borderRadius: 5,
              width: 5,
              height: 5,
            }}
          />
        </Flex>
      )}
      <Flex
        flexDirection="column"
        onClick={() => {
          //e.stopPropagation();
          if (isSelectionMode) {
            toggleSelection();
          } else if (props.onClick) {
            props.onClick();
          }
        }}
        sx={{
          width: "90%",
          ":hover": {
            cursor: "pointer",
          },
        }}
      >
        <Flex>
          {isSelectionMode && (
            <ItemSelector
              isSelected={isSelected}
              toggleSelection={toggleSelection}
            />
          )}
          <Text
            as="h3"
            color={props.focused ? "primary" : "text"}
            fontFamily={"heading"}
            fontSize="title"
            fontWeight={"bold"}
            sx={{
              lineHeight: "1.4em",
              maxHeight: "2.8em", // 2 lines, i hope
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            data-test-id={`${props.item.type}-${props.index}-title`}
          >
            {props.title}
          </Text>
        </Flex>

        <Text
          as="p"
          display={props.body ? "box" : "none"}
          variant="body"
          sx={{
            cursor: "pointer",
            lineHeight: "1.4em",
            maxHeight: "2.8em", // 2 lines, i hope
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          data-test-id={`${props.item.type}-${props.index}-body`}
        >
          {props.body}
        </Text>
        {props.subBody && props.subBody}
        <Text
          display={props.info ? "flex" : "none"}
          variant="body"
          fontSize={11}
          color="fontTertiary"
          sx={{ marginTop: 2 }}
        >
          {props.info}
        </Text>
      </Flex>
      {props.menuItems && (
        <Icon.MoreVertical
          size={22}
          color="icon"
          onClick={(event) => openContextMenu(event, true)}
        />
      )}
    </Flex>
  );
}
export default ListItem;
