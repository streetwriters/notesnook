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
  GroupHeader as GroupHeaderType,
  GroupingKey,
  GroupOptions
} from "@notesnook/core";
import {
  GroupBy,
  OrderAtoZ,
  OrderOldestNewest,
  OrderZtoA,
  OrderNewestOldest,
  SortBy
} from "../icons";
import { useEffect, useRef } from "react";
import { Flex, Text } from "@theme-ui/components";
import { db } from "../../common/db";
import { Menu, useMenuTrigger } from "../../hooks/use-menu";
import { MenuButtonItem, MenuItem } from "@notesnook/ui";
import { strings } from "@notesnook/intl";
import { useStore as useSearchStore } from "../../stores/search-store";
import type { Context } from "../list-container/types";

type GroupingMenuOptions = {
  groupOptions: GroupOptions;
  parentKey: keyof GroupOptions;
  groupingKey: GroupingKey;
  refresh: () => void;
  isSearching?: boolean;
  context?: Context;
};

const groupByMenu: (options: GroupingMenuOptions) => MenuItem | null = (
  options
) =>
  options.groupingKey === "reminders" || options.isSearching
    ? null
    : {
        type: "button",
        key: "groupBy",
        title: strings.groupBy(),
        icon: GroupBy.path,
        menu: {
          items: map(options, [
            { key: "none", title: strings.groupByStrings.none() },
            { key: "default", title: strings.groupByStrings.default() },
            { key: "year", title: strings.groupByStrings.year() },
            { key: "month", title: strings.groupByStrings.month() },
            { key: "week", title: strings.groupByStrings.week() },
            { key: "abc", title: strings.groupByStrings.abc() }
          ])
        }
      };

const orderByMenu: (options: GroupingMenuOptions) => MenuItem = (options) => ({
  type: "button",
  key: "sortDirection",
  title: strings.orderBy(),
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
            ? strings.aToZ()
            : options.groupOptions.sortBy === "dueDate"
            ? strings.earliestFirst()
            : options.groupOptions.sortBy === "relevance"
            ? strings.leastRelevantFirst()
            : strings.oldestToNewest()
      },
      {
        key: "desc",
        title:
          options.groupOptions.sortBy === "title"
            ? strings.zToA()
            : options.groupOptions.sortBy === "dueDate"
            ? strings.latestFirst()
            : options.groupOptions.sortBy === "relevance"
            ? strings.mostRelevantFirst()
            : strings.newestToOldest()
      }
    ])
  }
});

const sortByMenu: (options: GroupingMenuOptions) => MenuItem = (options) => ({
  type: "button",
  key: "sortBy",
  title: strings.sortBy(),
  icon: SortBy.path,
  menu: {
    items: map(options, [
      {
        key: "dateCreated",
        title: strings.sortByStrings.dateCreated(),
        isHidden: options.groupingKey === "trash"
      },
      {
        key: "dateEdited",
        title: strings.sortByStrings.dateEdited(),
        isHidden:
          options.groupingKey === "trash" || options.groupingKey === "tags"
      },
      {
        key: "dateDeleted",
        title: strings.sortByStrings.dateDeleted(),
        isHidden: options.groupingKey !== "trash"
      },
      {
        key: "dateModified",
        title: strings.sortByStrings.dateModified(),
        isHidden: options.groupingKey !== "tags"
      },
      {
        key: "dueDate",
        title: strings.sortByStrings.dueDate(),
        isHidden: options.groupingKey !== "reminders"
      },
      {
        key: "title",
        title: strings.sortByStrings.title()
      },
      {
        key: "relevance",
        title: strings.sortByStrings.relevance(),
        isHidden: options.groupingKey !== "search"
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
    refresh
  };

  Menu.openMenu(
    [
      orderByMenu({ ...menuOptions, parentKey: "sortDirection" }),
      sortByMenu({ ...menuOptions, parentKey: "sortBy" })
    ],
    {
      title: strings.sort()
    }
  );
}

export function showGroupOptionsMenu(
  groupingKey: GroupingKey,
  refresh: () => void,
  options?: {
    isSearching?: boolean;
    context?: Context;
  }
) {
  const groupOptions = getGroupOptions(
    options?.context,
    options?.isSearching,
    groupingKey
  );
  const menuOptions: Omit<GroupingMenuOptions, "parentKey"> = {
    groupingKey: options?.isSearching ? "search" : groupingKey,
    groupOptions,
    refresh,
    ...options
  };
  const groupBy = groupByMenu({ ...menuOptions, parentKey: "groupBy" });
  const menuItems = [
    orderByMenu({ ...menuOptions, parentKey: "sortDirection" }),
    sortByMenu({ ...menuOptions, parentKey: "sortBy" })
  ];
  if (groupBy) menuItems.push(groupBy);

  Menu.openMenu(menuItems, {
    title: groupBy ? "Group & sort" : "Sort"
  });
}

function getGroupOptions(
  context: Context | undefined,
  isSearching: boolean | undefined,
  groupingKey: GroupingKey
): GroupOptions {
  return isSearching
    ? db.settings.getGroupOptions("search")
    : context?.type === "notebook" ||
      context?.type === "tag" ||
      context?.type === "color"
    ? db.settings.getGroupOptionsById(context.id, context.type)
    : db.settings.getGroupOptions(groupingKey);
}

async function setGroupOptions(
  options: GroupingMenuOptions,
  groupOptions: GroupOptions
) {
  if (
    options.context?.type === "notebook" ||
    options.context?.type === "tag" ||
    options.context?.type === "color"
  ) {
    await db.settings.setGroupOptionsById(
      options.context.id,
      options.context.type,
      groupOptions
    );
  } else {
    await db.settings.setGroupOptions(options.groupingKey, groupOptions);
  }
}

async function changeGroupOptions(
  options: GroupingMenuOptions,
  item: Omit<MenuButtonItem, "type">
) {
  if (!parent) return false;

  const groupOptions: GroupOptions = { ...options.groupOptions };
  (groupOptions as any)[options.parentKey] = item.key;

  if (options.parentKey === "groupBy") {
    groupOptions.sortBy =
      options.groupingKey === "tags" || options.groupingKey === "trash"
        ? "dateModified"
        : groupOptions.sortBy;
  }

  await setGroupOptions(options, groupOptions);

  if (options.groupingKey === "search")
    useSearchStore.setState({ sortOptions: groupOptions });
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
  });
}

type GroupHeaderProps = {
  title: string;
  groups: () => Promise<{ index: number; group: GroupHeaderType }[]>;
  onJump: (index: number) => void;
  onSelectGroup: () => void;
  isFocused: boolean;
};
function GroupHeader(props: GroupHeaderProps) {
  const { title, groups, onJump, onSelectGroup, isFocused } = props;

  const groupHeaderRef = useRef<HTMLDivElement>(null);
  const { openMenu } = useMenuTrigger();

  useEffect(() => {
    if (isFocused && groupHeaderRef.current) groupHeaderRef.current.focus();
  }, [isFocused]);

  return (
    <Flex
      ref={groupHeaderRef}
      onClick={async (e) => {
        if (e.ctrlKey) {
          onSelectGroup();
          return;
        }
        e.stopPropagation();

        const groupItems = await groups();
        const items: MenuItem[] = groupItems.map(({ group, index }) => {
          const groupTitle = group.title.toString();
          return {
            type: "button",
            key: groupTitle,
            title: groupTitle,
            onClick: () => onJump(index),
            checked: group.title === title
          } as MenuItem;
        });
        if (!items.length) return;

        openMenu(items, {
          title: strings.jumpToGroup(),
          position: {
            target: groupHeaderRef.current,
            align: "start",
            isTargetAbsolute: true,
            location: "below",
            yOffset: 10
          }
        });
      }}
      // mx={1}
      // my={1}
      // py={1}
      // pl={1}
      // pr={0}
      sx={{
        cursor: "pointer",
        px: "spacing6",
        my: "spacing6",
        // borderBottom: "1px solid var(--border)",
        // border: isMenuTarget ? "1px solid" : "none",
        // borderColor: isMenuTarget ? "accent" : "transparent",
        ":focus": {
          borderColor: "accent"
        },
        alignItems: "center",
        justifyContent: "space-between"
      }}
      tabIndex={0}
      data-test-id="group-header"
    >
      <Text
        data-test-id="title"
        sx={{
          fontSize: "xs",
          fontWeight: 400,
          color: title === "Conflicted" ? "error" : "accent"
        }}
      >
        {title}
      </Text>
    </Flex>
  );
}
export default GroupHeader;
