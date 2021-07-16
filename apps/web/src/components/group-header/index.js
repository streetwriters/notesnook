import * as Icon from "../icons";
import React, { useMemo } from "react";
import { Button, Flex, Text } from "rebass";
import Animated from "../animated";
import { db } from "../../common/db";
import { useOpenContextMenu } from "../../utils/useContextMenu";
import { useStore as useSettingsStore } from "../../stores/setting-store";
import useMobile from "../../utils/use-mobile";

const groupByToTitleMap = {
  [undefined]: "Default",
  default: "Default",
  abc: "A - Z",
  year: "Year",
  week: "Week",
  month: "Month",
};

const menuItems = [
  {
    key: "sortDirection:asc",
    title: () => "Order by ascending",
  },
  { key: "sortDirection:desc", title: () => "Order by descending" },
  { key: "orderSeperator", type: "seperator" },
  {
    key: "sortBy:dateCreated",
    title: () => "Sort by date created",
  },
  {
    key: "sortBy:dateEdited",
    title: () => "Sort by date edited",
  },
  {
    key: "sortBy:title",
    title: () => "Sort by title",
  },
  { key: "sortSeperator", type: "seperator" },
  { key: "groupBy:default", title: () => "Group by default" },
  { key: "groupBy:year", title: () => "Group by year" },
  { key: "groupBy:month", title: () => "Group by month" },
  { key: "groupBy:week", title: () => "Group by week" },
  { key: "groupBy:abc", title: () => "Group by A - Z" },
];

function changeGroupOptions({ groupOptions, type, refresh }, { key: itemKey }) {
  let [key, value] = itemKey.split(":");
  groupOptions[key] = value;
  if (key === "groupBy") {
    if (value === "abc") groupOptions.sortBy = "title";
    else groupOptions.sortBy = "dateEdited";
}
  db.settings.setGroupOptions(type, groupOptions);
  refresh();
}

const getMenuItems = (groupOptions) => {
  return menuItems.map((item) => {
    if (item.type === "seperator") return item;
    let [key, value] = item.key.split(":");

    item.checked = groupOptions[key] === value;

    if (key === "sortBy") {
      if (value === "title")
        item.disabled = () => groupOptions.groupBy !== "abc";
      else item.disabled = () => groupOptions.groupBy === "abc";
    }

    item.onClick = changeGroupOptions;
    return item;
  });
};

function GroupHeader(props) {
  const { title, groups, onJump, index, type, refresh } = props;
  const groupOptions = useMemo(() => db.settings.getGroupOptions(type), [type]);
  const openContextMenu = useOpenContextMenu();

  if (!title) return null;

  return (
    <Animated.Flex
      transition={{ duration: 0.3, repeatType: "reverse", repeat: 3 }}
      onClick={(e) => {
        if (groups.length <= 0) return;
        e.stopPropagation();
        const items = groups.map((group) => ({
          key: group.title,
          title: () => group.title,
          onClick: () => onJump(group.title),
          checked: group.title === title,
        }));
        openContextMenu(e, items, {
          title: "Jump to group",
        });
      }}
      p={1}
      mx={1}
      my={1}
      py={index > 0 ? [2, "8px"] : 1}
        alignItems="center"
        justifyContent="space-between"
      bg="bgSecondary"
      sx={{ borderRadius: "default" }}
      >
        <Text variant="subtitle" color="primary">
          {title}
        </Text>

        {index === 0 && (
        <Flex mr={1}>
          <IconButton
            icon={
              groupOptions.sortDirection === "asc"
                ? Icon.SortAsc
                : Icon.SortDesc
            }
            title={`Grouped by ${groupByToTitleMap[groupOptions.groupBy]}`}
            onClick={(e) => {
              const items = getMenuItems(groupOptions);
              openContextMenu(e, items, {
                title: "Group & sort",
                groupOptions,
                refresh,
                type,
              });
            }}
          />
        )}
      </Flex>
      <Flex
        flexDirection="column"
        p={menuType === "jumpto" ? 2 : 0}
        pt={2}
        style={{
          display: isExpanded ? "flex" : "none",
        }}
        justifyContent="center"
        sx={{
          position: "absolute",
          zIndex: 1,
          bg: "bgSecondary",
          width: "100%",
          top: "29px",
          borderBottom: "1px solid",
          borderBottomColor: "border",
          borderBottomWidth: 1,
          boxShadow: "0px 3px 6px 0px #0000005e",
        }}
      >
        <JumpToGroupMenu
          onJump={(title) => {
            setIsExpanded(false);
            onJump(title);
          }}
          isVisible={menuType === "jumpto"}
          groups={groups}
        />
      </Flex>
      )}
    </Animated.Flex>
  );
}
export default GroupHeader;

function IconButton(props) {
  const { text, title, onClick } = props;
  const isMobile = useMobile();
  return (
    <Button
      variant="secondary"
      bg="transparent"
      display="flex"
      alignItems="center"
      title={title}
      p={1}
      mr={[2, 0]}
      sx={{ ":last-of-type": { mr: 0 } }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      {text && <Text variant="body">{text}</Text>}
      {props.icon && (
        <props.icon size={isMobile ? 20 : 14} sx={{ ml: text ? 1 : 0 }} />
          )}
    </Button>
  );
}
