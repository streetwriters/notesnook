import React, { useEffect, useCallback, useMemo } from "react";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import {
  store as selectionStore,
  useStore as useSelectionStore,
} from "../../stores/selection-store";
import { useOpenContextMenu } from "../../utils/useContextMenu";

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
  return isSelected ? (
    <Icon.Check
      color="primary"
      size={16}
      sx={{
        marginLeft: 0,
        marginRight: 1,
        color: "primary",
        cursor: "pointer",
      }}
      onClick={() => toggleSelection()}
    />
  ) : (
    <Icon.CircleEmpty
      size={16}
      sx={{
        marginLeft: 0,
        marginRight: 1,
        cursor: "pointer",
      }}
    />
  );
};

function ListItem(props) {
  const isSelectionMode = useSelectionStore((store) => store.isSelectionMode);
  const selectedItems = useSelectionStore((store) => store.selectedItems);
  const isSelected =
    selectedItems.findIndex((item) => props.item.id === item.id) > -1;
  const selectItem = useSelectionStore((store) => store.selectItem);

  const openContextMenu = useOpenContextMenu();

  const toggleSelection = useCallback(
    function toggleSelection() {
      selectItem(props.item);
    },
    [selectItem, props.item]
  );

  const menuItems = useMemo(() => {
    let items = props.menuItems;
    if (props.selectable)
      items = [selectMenuItem(isSelected, toggleSelection), ...items];
    return items;
  }, [props.menuItems, isSelected, toggleSelection, props.selectable]);

  useEffect(() => {
    if (!isSelectionMode && isSelected) toggleSelection();
  }, [isSelectionMode, toggleSelection, isSelected]);

  return (
    <Flex
      bg={props.focused || isSelected ? "shade" : "background"}
      alignItems="center"
      onContextMenu={(e) => openContextMenu(e, menuItems, false)}
      p={2}
      justifyContent="space-between"
      sx={{
        height: "inherit",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        cursor: "pointer",
        position: "relative",
        ":hover": {
          backgroundColor: "shade",
        },
      }}
      data-test-id={`${props.item.type}-${props.index}`}
    >
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
        {props.header}
        <Flex>
          {isSelectionMode && (
            <ItemSelector
              isSelected={isSelected}
              toggleSelection={toggleSelection}
            />
          )}
          <Text
            color={props.bg ? props.bg : "text"}
            fontFamily={"heading"}
            fontSize="title"
            fontWeight={"bold"}
            sx={{
              lineHeight: "1.4rem",
              maxHeight: "1.4rem", // 2 lines, i hope
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
          sx={{ marginTop: 1 }}
        >
          {props.info}
        </Text>
      </Flex>
      {props.menuItems && (
        <Icon.MoreVertical
          size={22}
          sx={{ marginRight: [3, 2, 0] }}
          color="icon"
          onClick={(event) => openContextMenu(event, menuItems, true)}
        />
      )}
    </Flex>
  );
}
export default ListItem;
