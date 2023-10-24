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

import {
  GroupBy,
  OrderAtoZ,
  OrderOldestNewest,
  OrderZtoA,
  OrderNewestOldest,
  SortBy,
  SortAsc,
  SortDesc,
  DetailedView,
  CompactView,
  Icon
} from "../icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { db } from "../../common/db";
import { Menu, useMenuTrigger } from "../../hooks/use-menu";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import useMobile from "../../hooks/use-mobile";
import { MenuButtonItem, MenuItem } from "@notesnook/ui";
import {
  GroupHeader as GroupHeaderType,
  GroupOptions,
  GroupingKey
} from "@notesnook/core/dist/types";

const groupByToTitleMap = {
  none: "None",
  default: "Default",
  abc: "A - Z",
  year: "Year",
  week: "Week",
  month: "Month"
};

type GroupingMenuOptions = {
  groupOptions: GroupOptions;
  parentKey: keyof GroupOptions;
  groupingKey: GroupingKey;
  refresh: () => void;
  isUngrouped: boolean;
};

const groupByMenu: (options: GroupingMenuOptions) => MenuItem | null = (
  options
) =>
  options.groupingKey === "reminders"
    ? null
    : {
        type: "button",
        key: "groupBy",
        title: "Group by",
        icon: GroupBy.path,
        menu: {
          items: map(options, [
            { key: "none", title: "None" },
            { key: "default", title: "Default" },
            { key: "year", title: "Year" },
            { key: "month", title: "Month" },
            { key: "week", title: "Week" },
            { key: "abc", title: "A - Z" }
          ])
        }
      };

const orderByMenu: (options: GroupingMenuOptions) => MenuItem = (options) => ({
  type: "button",
  key: "sortDirection",
  title: "Order by",
  icon:
    options.groupOptions.sortDirection === "asc"
      ? options.groupOptions.sortBy === "title"
        ? OrderAtoZ.path
        : OrderOldestNewest.path
      : options.groupOptions.sortBy === "title"
      ? OrderZtoA.path
      : OrderNewestOldest.path,
  menu: {
    items: map(options, [
      {
        key: "asc",
        title:
          options.groupOptions.sortBy === "title"
            ? "A - Z"
            : options.groupOptions.sortBy === "dueDate"
            ? "Earliest first"
            : "Oldest - newest"
      },
      {
        key: "desc",
        title:
          options.groupOptions.sortBy === "title"
            ? "Z - A"
            : options.groupOptions.sortBy === "dueDate"
            ? "Latest first"
            : "Newest - oldest"
      }
    ])
  }
});

const sortByMenu: (options: GroupingMenuOptions) => MenuItem = (options) => ({
  type: "button",
  key: "sortBy",
  title: "Sort by",
  icon: SortBy.path,
  menu: {
    items: map(options, [
      {
        key: "dateCreated",
        title: "Date created",
        isHidden:
          options.groupingKey === "trash" || options.groupingKey === "tags"
      },
      {
        key: "dateEdited",
        title: "Date edited",
        isHidden:
          options.groupingKey === "trash" || options.groupingKey === "tags"
      },
      {
        key: "dateDeleted",
        title: "Date deleted",
        isHidden: options.groupingKey !== "trash"
      },
      {
        key: "dateModified",
        title: "Date modified",
        isHidden: options.groupingKey !== "tags"
      },
      {
        key: "dueDate",
        title: "Due date",
        isHidden: options.groupingKey !== "reminders"
      },
      {
        key: "title",
        title: "Title",
        isHidden:
          !options.isUngrouped &&
          options.parentKey === "sortBy" &&
          options.groupOptions.groupBy !== "abc" &&
          options.groupOptions.groupBy !== "none"
      }
    ])
  }
});

export function showSortMenu(groupingKey: GroupingKey, refresh: () => void) {
  const groupOptions = db.settings.getGroupOptions(groupingKey);
  if (!groupOptions) return;

  const menuOptions: Omit<GroupingMenuOptions, "parentKey"> = {
    groupingKey,
    groupOptions,
    isUngrouped: true,
    refresh
  };

  Menu.openMenu(
    [
      orderByMenu({ ...menuOptions, parentKey: "sortDirection" }),
      sortByMenu({ ...menuOptions, parentKey: "sortBy" })
    ],
    {
      title: "Sort"
    }
  );
}

async function changeGroupOptions(
  options: GroupingMenuOptions,
  item: Omit<MenuButtonItem, "type">
) {
  if (!parent) return false;

  const groupOptions: GroupOptions = { ...options.groupOptions };
  (groupOptions as any)[options.parentKey] = item.key;

  if (options.parentKey === "groupBy") {
    if (item.key === "abc") groupOptions.sortBy = "title";
    else groupOptions.sortBy = "dateEdited";
  }
  await db.settings.setGroupOptions(options.groupingKey, groupOptions);
  options.refresh();
}

function map(
  options: GroupingMenuOptions,
  items: Omit<MenuButtonItem, "type">[]
): MenuItem[] {
  return items.map((item) => {
    item.isChecked = options.groupOptions[options.parentKey] === item.key;
    item.onClick = () => changeGroupOptions(options, item);
    return { ...item, type: "button" };
  }, []);
}

type GroupHeaderProps = {
  title: string;
  groupingKey: GroupingKey;
  index: number;

  groups: GroupHeaderType[];
  onJump: (title: string) => void;
  refresh: () => void;
  onSelectGroup: () => void;
  isFocused: boolean;
};
function GroupHeader(props: GroupHeaderProps) {
  const {
    title,
    groups,
    onJump,
    index,
    groupingKey,
    refresh,
    onSelectGroup,
    isFocused
  } = props;
  const [groupOptions, setGroupOptions] = useState(
    db.settings.getGroupOptions(groupingKey)
  );
  const groupHeaderRef = useRef<HTMLDivElement>(null);
  const { openMenu, target } = useMenuTrigger();
  const notesViewMode = useNoteStore((store) => store.viewMode);
  const setNotesViewMode = useNoteStore((store) => store.setViewMode);
  const notebooksViewMode = useNotebookStore((store) => store.viewMode);
  const setNotebooksViewMode = useNotebookStore((store) => store.setViewMode);

  useEffect(() => {
    if (isFocused && groupHeaderRef.current) groupHeaderRef.current.focus();
  }, [isFocused]);
  const isMenuTarget = target && target === groupHeaderRef.current;

  const [viewMode, setViewMode] = useMemo(() => {
    if (
      groupingKey === "home" ||
      groupingKey === "notes" ||
      groupingKey === "favorites"
    ) {
      return [notesViewMode, setNotesViewMode];
    } else if (groupingKey === "notebooks")
      return [notebooksViewMode, setNotebooksViewMode];
    else return [null, null];
  }, [
    groupingKey,
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
        const items: MenuItem[] = groups.map((group) => {
          const groupTitle = group.title.toString();
          return {
            type: "button",
            key: groupTitle,
            title: groupTitle,
            onClick: () => onJump(groupTitle),
            checked: group.title === title
          };
        });
        openMenu(items, {
          title: "Jump to group",
          position: {
            target: groupHeaderRef.current,
            align: "start",
            isTargetAbsolute: true,
            location: "below",
            yOffset: 10
          }
        });
      }}
      mx={1}
      my={1}
      py={1}
      pl={1}
      pr={0}
      bg="var(--background-secondary)"
      sx={{
        borderRadius: "default",
        cursor: "pointer",
        border: isMenuTarget ? "1px solid" : "none",
        borderColor: isMenuTarget ? "accent" : "transparent",
        ":focus": {
          border: "1px solid",
          borderColor: "accent",
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
          {groupingKey && (
            <IconButton
              testId={`${groupingKey}-sort-button`}
              icon={groupOptions.sortDirection === "asc" ? SortAsc : SortDesc}
              title={`Grouped by ${
                groupByToTitleMap[groupOptions.groupBy || "default"]
              }`}
              onClick={() => {
                const groupOptions = db.settings!.getGroupOptions(groupingKey);
                setGroupOptions(groupOptions);

                const menuOptions: Omit<GroupingMenuOptions, "parentKey"> = {
                  groupingKey,
                  groupOptions,
                  isUngrouped: false,
                  refresh
                };
                const groupBy = groupByMenu({
                  ...menuOptions,
                  parentKey: "groupBy"
                });

                const menuItems = [
                  orderByMenu({
                    ...menuOptions,
                    parentKey: "sortDirection"
                  }),
                  sortByMenu({
                    ...menuOptions,
                    parentKey: "sortBy"
                  })
                ];
                if (groupBy) menuItems.push(groupBy);

                openMenu(menuItems, {
                  title: groupBy ? "Group & sort" : "Sort"
                });
              }}
            />
          )}
          {viewMode && (
            <IconButton
              icon={viewMode === "compact" ? DetailedView : CompactView}
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
  );
}
export default GroupHeader;

type IconButtonProps = {
  text?: string;
  title: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  testId?: string;
  icon: Icon;
};
function IconButton(props: IconButtonProps) {
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
