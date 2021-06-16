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
    key: "select",
    title: () => (isSelected ? "Unselect" : "Select"),
    icon: Icon.Select,
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
    <Icon.CheckCircle
      color="primary"
      size={16}
      sx={{
        flexShrink: 0,
        marginLeft: 0,
        marginRight: 1,
        color: "primary",
        cursor: "pointer",
      }}
      onClick={(e) => {
        e.stopPropagation();
        toggleSelection();
      }}
    />
  ) : (
    <Icon.CircleEmpty
      size={16}
      sx={{
        flexShrink: 0,
        marginLeft: 0,
        marginRight: 1,
        bg: "transparent",
        cursor: "pointer",
      }}
      onClick={(e) => {
        e.stopPropagation();
        toggleSelection();
      }}
    />
  );
};

function ListItem(props) {
  const {
    colors: { shade = "shade", text = "text" } = {
      shade: "shade",
      text: "text",
    },
  } = props;

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
    let items = props.menu?.items;
    if (!items) return [];
    if (props.selectable)
      items = [selectMenuItem(isSelected, toggleSelection), ...items];
    return items;
  }, [props.menu?.items, isSelected, toggleSelection, props.selectable]);

  useEffect(() => {
    if (!isSelectionMode && isSelected) toggleSelection();
  }, [isSelectionMode, toggleSelection, isSelected]);

  return (
    <Flex
      bg={isSelected ? shade : "background"}
      onContextMenu={(e) =>
        openContextMenu(e, menuItems, props.menu?.extraData, false)
      }
      p={2}
      tabIndex={props.index}
      justifyContent="center"
      sx={{
        height: "inherit",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        cursor: "pointer",
        position: "relative",
        ":hover": {
          backgroundColor: shade,
        },
        ":focus": {
          outline: "none",
        },
        ":focus-visible": {
          border: "1px solid",
          borderColor: "primary",
        },
      }}
      onKeyPress={(e) => {
        if (e.key === "Enter") e.target.click();
      }}
      flexDirection="column"
      onClick={() => {
        //e.stopPropagation();
        if (isSelectionMode) {
          toggleSelection();
        } else if (props.onClick) {
          props.onClick();
        }
      }}
      data-test-id={`${props.item.type}-${props.index}`}
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
          color={text}
          fontFamily={"heading"}
          fontSize="title"
          fontWeight={"bold"}
          sx={{
            lineHeight: "1.4rem",
            maxHeight: "1.4rem", // 1 lines, i hope
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          mr={4}
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
          maxWidth: "90%",
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
      {props.footer}
      {props.menu && (
        <Icon.MoreVertical
          sx={{ position: "absolute", right: 1 }}
          size={22}
          color="icon"
          onClick={(event) => {
            event.stopPropagation();
            openContextMenu(event, menuItems, props.menu.extraData, true);
          }}
        />
      )}
    </Flex>
  );
}
export default ListItem;
