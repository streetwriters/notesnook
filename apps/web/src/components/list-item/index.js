import React, { useEffect, useCallback, useMemo } from "react";
import { Box, Flex, Text } from "rebass";
import * as Icon from "../icons";
import {
  store as selectionStore,
  useStore as useSelectionStore,
} from "../../stores/selection-store";
import { useOpenContextMenu } from "../../utils/useContextMenu";
import { SELECTION_OPTIONS_MAP } from "../../common";
import Config from "../../utils/config";
import { db } from "../../common/db";
import * as clipboard from "clipboard-polyfill/text";

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

function debugMenuItems(type) {
  if (!type) return [];
  return [
    {
      key: "copy-data",
      title: () => "Copy data",
      icon: Icon.Copy,
      onClick: async ({ [type]: item }) => {
        if (type === "note" && item.contentId) {
          item.additionalData = {
            content: db.debug.strip(await db.content.raw(item.contentId)),
          };
        }
        item.additionalData = {
          ...item.additionalData,
          lastSynced: await db.lastSynced(),
        };
        await clipboard.writeText(db.debug.strip(item));
      },
    },
  ];
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
    colors: { text, background, primary } = {
      primary: "primary",
      text: "text",
      background: "background",
    },
    isFocused,
    isCompact,
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

    if (isSelectionMode) {
      const options = SELECTION_OPTIONS_MAP[window.currentViewType];
      items = options.map((option) => {
        return {
          key: option.key,
          title: () => option.title,
          icon: option.icon,
          onClick: option.onClick,
        };
      });
    }
    if (props.selectable)
      items = [selectMenuItem(isSelected, toggleSelection), ...items];
    if (Config.get("debugMode", false))
      items = [...items, ...debugMenuItems(props.item.type)];
    return items;
  }, [
    props.menu?.items,
    props.item.type,
    isSelected,
    isSelectionMode,
    toggleSelection,
    props.selectable,
  ]);

  useEffect(() => {
    if (!isSelectionMode && isSelected) toggleSelection();
  }, [isSelectionMode, toggleSelection, isSelected]);

  return (
    <Flex
      bg={isSelected ? "bgSecondary" : background}
      onContextMenu={(e) =>
        openContextMenu(e, menuItems, props.menu?.extraData, false)
      }
      p={2}
      py={isCompact ? 1 : 2}
      tabIndex={0}
      sx={{
        height: "inherit",
        cursor: "pointer",
        position: "relative",
        boxShadow: isFocused
          ? `5px 2px 0px -2px var(--${primary}) inset`
          : "none",
        transition: "box-shadow 200ms ease-in",
        ":hover": {
          backgroundColor: "hover",
        },
        ":focus": {
          outline: "none",
        },
        ":focus-visible": {
          border: "1px solid",
          borderColor: primary,
        },
        overflow: "hidden",
        maxWidth: "100%",
      }}
      onKeyPress={(e) => {
        if (e.key === "Enter") e.target.click();
      }}
      flexDirection={isCompact ? "row" : "column"}
      justifyContent={isCompact ? "space-between" : "center"}
      alignItems={isCompact ? "center" : undefined}
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
      {!isCompact && props.header}

      <Text
        data-test-id={`${props.item.type}-${props.index}-title`}
        variant={isCompact ? "subtitle" : "title"}
        fontWeight={isCompact ? "body" : "bold"}
        color={text}
        display={isSelectionMode ? "flex" : "block"}
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {isSelectionMode && (
          <ItemSelector
            isSelected={isSelected}
            toggleSelection={toggleSelection}
          />
        )}
        {props.title}
      </Text>

      {!isCompact && props.body && (
        <Text
          as="p"
          variant="body"
          data-test-id={`${props.item.type}-${props.index}-body`}
          sx={{
            lineHeight: `1.2rem`,
            overflow: "hidden",
            textOverflow: "ellipsis",
            position: "relative",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
          }}
        >
          {props.body}
        </Text>
      )}
      {props.footer ? (
        <Box flexShrink={0} ml={isCompact ? 1 : 0} mt={isCompact ? 0 : 1}>
          {props.footer}
        </Box>
      ) : null}
    </Flex>
  );
}
export default ListItem;
