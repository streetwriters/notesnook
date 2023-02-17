/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import * as Icon from "../icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { db } from "../../common/db";
import { Menu, useMenuTrigger } from "../../hooks/use-menu";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import useMobile from "../../hooks/use-mobile";
import { ThemeVariant } from "../theme-provider";

const groupByToTitleMap = {
  [undefined]: "Default",
  none: "None",
  default: "Default",
  abc: "A - Z",
  year: "Year",
  week: "Week",
  month: "Month"
};

const groupByMenu = {
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
};

const orderByMenu = {
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
};

const sortByMenu = {
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
      hidden: ({ groupOptions, parent, isUngrouped }, item) => {
        if (isUngrouped) return false;

        return (
          parent?.key === "sortBy" &&
          item.key === "title" &&
          groupOptions.groupBy !== "abc" &&
          groupOptions.groupBy !== "none"
        );
      }
    }
  ])
};

export function showSortMenu(type, refresh) {
  const groupOptions = db.settings.getGroupOptions(type);
  Menu.openMenu([orderByMenu, sortByMenu], {
    title: "Sort",
    groupOptions,
    refresh,
    type,
    isUngrouped: true
  });
}

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

function map(items) {
  return items.map((item) => {
    item.checked = isChecked;
    item.onClick = changeGroupOptions;
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
    <ThemeVariant variant="secondary" injectCssVars>
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
        bg="background"
        sx={{
          borderRadius: "default",
          cursor: "pointer",
          border: isMenuTarget ? "1px solid var(--accent)" : "none",
          ":focus": {
            border: "1px solid var(--accent)",
            outline: "none"
          },
          alignItems: "center",
          justifyContent: "space-between"
        }}
        tabIndex={0}
        data-test-id="group-header"
      >
        <Text
          data-test-id="title"
          variant="subtitle"
          sx={{
            fontSize: "body",
            color: title === "Conflicted" ? "error" : "accent"
          }}
        >
          {title}
        </Text>

        {index === 0 && (
          <Flex mr={1}>
            {type && (
              <IconButton
                testId={`${type}-sort-button`}
                icon={
                  groupOptions.sortDirection === "asc"
                    ? Icon.SortAsc
                    : Icon.SortDesc
                }
                title={`Grouped by ${groupByToTitleMap[groupOptions.groupBy]}`}
                onClick={() => {
                  const groupOptions = db.settings.getGroupOptions(type);
                  setGroupOptions(groupOptions);

                  openMenu([orderByMenu, sortByMenu, groupByMenu], {
                    title: "Group & sort",
                    groupOptions,
                    refresh,
                    type
                  });
                }}
              />
            )}
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
                onClick={() =>
                  setViewMode(viewMode === "compact" ? "detailed" : "compact")
                }
              />
            )}
          </Flex>
        )}
      </Flex>
    </ThemeVariant>
  );
}
export default GroupHeader;

function IconButton(props) {
  const { text, title, onClick, testId } = props;
  const isMobile = useMobile();
  return (
    <Button
      variant="secondary"
      bg="transparent"
      title={title}
      p={"2px"}
      mr={[2, 0]}
      data-test-id={testId}
      sx={{ ":last-of-type": { mr: 0 }, alignItems: "center", display: "flex" }}
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
