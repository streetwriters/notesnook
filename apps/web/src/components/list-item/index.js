import { Box, Flex, Text } from "rebass";
import * as Icon from "../icons";
import {
  store as selectionStore,
  useStore as useSelectionStore,
} from "../../stores/selection-store";
import { useMenuTrigger } from "../../hooks/use-menu";
import Config from "../../utils/config";
import { db } from "../../common/db";
import * as clipboard from "clipboard-polyfill/text";
import { useRef } from "react";

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

  const listItemRef = useRef();
  const { openMenu, target } = useMenuTrigger();
  const isMenuTarget = target && target === listItemRef.current;

  const isSelected = useSelectionStore((store) => {
    const inInSelection =
      store.selectedItems.findIndex((item) => props.item.id === item.id) > -1;
    return isFocused
      ? store.selectedItems.length > 1 && inInSelection
      : inInSelection;
  });

  const selectItem = useSelectionStore((store) => store.selectItem);

  return (
    <Flex
      ref={listItemRef}
      bg={isSelected ? "shade" : background}
      onContextMenu={(e) => {
        e.preventDefault();
        let items = props.menu?.items?.slice() || [];
        let title = props.item.title;
        let selectedItems = selectionStore
          .get()
          .selectedItems.filter((i) => i.type === props.item.type);

        if (selectedItems.length > 1) {
          title = `${selectedItems.length} items selected`;
          items = items.filter((item) => item.multiSelect);
        } else if (Config.get("debugMode", false)) {
          items.push(...debugMenuItems(props.item.type));
        }

        if (selectedItems.indexOf(props.item) === -1) {
          selectedItems.push(props.item);
        }

        if (items.length <= 0) return;

        openMenu(items, {
          title,
          items: selectedItems,
          target: listItemRef.current,
          ...props.menu?.extraData,
        });
      }}
      p={2}
      py={isCompact ? 1 : 2}
      tabIndex={-1}
      sx={{
        height: "inherit",
        cursor: "pointer",
        position: "relative",
        boxShadow: isFocused
          ? `5px 2px 0px -2px var(--${primary}) inset`
          : "none",
        transition: "box-shadow 200ms ease-in",
        // isMenuTarget
        borderTop: isMenuTarget ? `1px solid var(--${primary})` : "none",
        borderBottom: isMenuTarget ? `1px solid var(--${primary})` : "none",
        ":hover": {
          backgroundColor: isSelected ? "shade" : "hover",
        },
        ":focus,:focus-visible": {
          outline: "none",
          borderTop: `1px solid var(--${primary})`,
          borderBottom: `1px solid var(--${primary})`,
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
      onClick={(e) => {
        if (e.shiftKey) {
          //ignore (handled by listcontainer)
        } else if (e.ctrlKey) {
          selectItem(props.item);
        } else {
          selectionStore.toggleSelectionMode(false);
          if (props.onClick) {
            selectItem(props.item);
            props.onClick();
          }
        }
      }}
      data-test-id={`${props.item.type}-${props.index}`}
    >
      {!isCompact && props.header}

      <Text
        data-test-id={`${props.item.type}-${props.index}-title`}
        variant={"subtitle"}
        fontWeight={isCompact ? "body" : "bold"}
        color={text}
        display={"block"}
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
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
