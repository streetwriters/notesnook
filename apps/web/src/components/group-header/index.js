import * as Icon from "../icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Flex, Text } from "rebass";
import { db } from "../../common/db";
import { useMenuTrigger } from "../../hooks/use-menu";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import useMobile from "../../hooks/use-mobile";

const groupByToTitleMap = {
  [undefined]: "Default",
  none: "None",
  default: "Default",
  abc: "A - Z",
  year: "Year",
  week: "Week",
  month: "Month"
};

const menuItems = [
  {
    key: "sortDirection",
    title: "Order by",
    icon: ({ groupOptions }) =>
      groupOptions.sortDirection === "asc"
        ? groupOptions.sortBy === "title"
          ? Icon.OrderAtoZ
          : Icon.OrderOldestNewest
        : groupOptions.sortBy === "title"
        ? Icon.OrderZtoA
        : Icon.OrderNewestOldest,
    items: map([
      {
        key: "asc",
        title: ({ groupOptions }) =>
          groupOptions.sortBy === "title" ? "A - Z" : "Oldest - newest"
      },
      {
        key: "desc",
        title: ({ groupOptions }) =>
          groupOptions.sortBy === "title" ? "Z - A" : "Newest - oldest"
      }
    ])
  },
  {
    key: "sortBy",
    title: "Sort by",
    icon: Icon.SortBy,
    items: map([
      {
        key: "dateCreated",
        title: "Date created",
        hidden: ({ type }) => type === "trash"
      },
      {
        key: "dateEdited",
        title: "Date edited",
        hidden: ({ type }) => type === "trash" || type === "tags"
      },
      {
        key: "dateDeleted",
        title: "Date deleted",
        hidden: ({ type }) => type !== "trash"
      },
      {
        key: "dateModified",
        title: "Date modified",
        hidden: ({ type }) => type !== "tags"
      },
      {
        key: "title",
        title: "Title",
        hidden: ({ groupOptions, parent }, item) => {
          return (
            parent?.key === "sortBy" &&
            item.key === "title" &&
            groupOptions.groupBy !== "abc" &&
            groupOptions.groupBy !== "none"
          );
        }
      }
    ])
  },
  {
    key: "groupBy",
    title: "Group by",
    icon: Icon.GroupBy,
    items: map([
      { key: "none", title: "None" },
      { key: "default", title: "Default" },
      { key: "year", title: "Year" },
      { key: "month", title: "Month" },
      { key: "week", title: "Week" },
      { key: "abc", title: "A - Z" }
    ])
  }
];

function changeGroupOptions({ groupOptions, type, refresh, parent }, item) {
  if (!parent) return false;

  groupOptions[parent.key] = item.key;
  if (parent.key === "groupBy") {
    if (item.key === "abc") groupOptions.sortBy = "title";
    else groupOptions.sortBy = "dateEdited";
  }
  db.settings.setGroupOptions(type, groupOptions);
  refresh();
}

function isChecked({ groupOptions, parent }, item) {
  if (!parent) return false;
  return groupOptions[parent.key] === item.key;
}

function isDisabled({ groupOptions, parent }, item) {
  return (
    parent?.key === "sortBy" &&
    item.key === "title" &&
    groupOptions.groupBy === "abc"
  );
}

function map(items) {
  return items.map((item) => {
    item.checked = isChecked;
    item.onClick = changeGroupOptions;
    item.disabled = isDisabled;
    return item;
  }, []);
}

function GroupHeader(props) {
  const {
    title,
    groups,
    onJump,
    index,
    type,
    refresh,
    onSelectGroup,
    isFocused
  } = props;
  const [groupOptions, setGroupOptions] = useState(
    db.settings.getGroupOptions(type)
  );
  const groupHeaderRef = useRef();
  const { openMenu, target } = useMenuTrigger();
  const notesViewMode = useNoteStore((store) => store.viewMode);
  const setNotesViewMode = useNoteStore((store) => store.setViewMode);
  const notebooksViewMode = useNotebookStore((store) => store.viewMode);
  const setNotebooksViewMode = useNotebookStore((store) => store.setViewMode);

  useEffect(() => {
    if (isFocused) groupHeaderRef.current.focus();
  }, [isFocused]);
  const isMenuTarget = target && target === groupHeaderRef.current;

  const [viewMode, setViewMode] = useMemo(() => {
    if (type === "home" || type === "notes" || type === "favorites") {
      return [notesViewMode, setNotesViewMode];
    } else if (type === "notebooks")
      return [notebooksViewMode, setNotebooksViewMode];
    else return [null, null];
  }, [
    type,
    notesViewMode,
    notebooksViewMode,
    setNotesViewMode,
    setNotebooksViewMode
  ]);

  return (
    <Flex
      ref={groupHeaderRef}
      onClick={(e) => {
        if (e.ctrlKey) {
          onSelectGroup();
          return;
        }
        if (groups.length <= 0) return;
        e.stopPropagation();
        const items = groups.map((group) => {
          const groupTitle = group.title.toString();
          return {
            key: groupTitle,
            title: () => groupTitle,
            onClick: () => onJump(groupTitle),
            checked: group.title === title
          };
        });
        openMenu(items, {
          title: "Jump to group",
          target: groupHeaderRef.current
        });
      }}
      mx={1}
      my={1}
      py={1}
      pl={1}
      pr={0}
      alignItems="center"
      justifyContent="space-between"
      bg="bgSecondary"
      sx={{
        borderRadius: "default",
        cursor: "pointer",
        border: isMenuTarget ? "1px solid var(--primary)" : "none",
        ":focus": {
          border: "1px solid var(--primary)",
          outline: "none"
        }
      }}
      tabIndex={0}
    >
      <Text
        variant="subtitle"
        fontSize={"body"}
        color={title === "Conflicted" ? "error" : "primary"}
      >
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
              const groupOptions = db.settings.getGroupOptions(type);
              setGroupOptions(groupOptions);

              openMenu(menuItems, {
                title: "Group & sort",
                groupOptions,
                refresh,
                type
              });
            }}
          />
          {viewMode && (
            <IconButton
              icon={
                viewMode === "compact" ? Icon.DetailedView : Icon.CompactView
              }
              title={
                viewMode === "compact"
                  ? "Switch to detailed view"
                  : "Switch to compact view"
              }
              onClick={(e) =>
                setViewMode(viewMode === "compact" ? "detailed" : "compact")
              }
            />
          )}
        </Flex>
      )}
    </Flex>
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
      p={"2px"}
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
