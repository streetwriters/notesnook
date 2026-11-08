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

import { useEffect, useRef } from "react";
import type {
  GroupHeader as GroupHeaderType,
  GroupingKey,
  GroupOptions
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { usePromise } from "@notesnook/common";
import {
  Flex,
  Text,
  type MenuButtonItem,
  type MenuItem,
  type UIElement
} from "@ui";
import {
  Ellipse,
  OrderAlphabeticalAscending,
  OrderAlphabeticalDescending,
  OrderNumericAscending,
  OrderNumericDescending,
  SelectAll,
  SortAscending
} from "../icons";
import { db } from "../../common/db";
import { Menu } from "../../hooks/use-menu";
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
        iconComponent: SelectAll,
        menu: {
          title: strings.groupBy(),
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
  iconComponent:
    options.groupOptions.sortDirection === "asc"
      ? options.groupOptions.sortBy === "title"
        ? OrderAlphabeticalAscending
        : OrderNumericDescending
      : options.groupOptions.sortBy === "title"
      ? OrderAlphabeticalDescending
      : OrderNumericAscending,
  menu: {
    title: strings.orderBy(),
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
  iconComponent: SortAscending,
  menu: {
    title: strings.sortBy(),
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
    title: groupBy ? strings.groupAndSort() : strings.sort()
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
  groups?: () => Promise<{ index: number; group: GroupHeaderType }[]>;
  onJump?: (index: number) => void;
  onSelectGroup?: () => void;
  isFocused?: boolean;
  showGroupCounts?: boolean;
};
function GroupHeader(props: GroupHeaderProps) {
  const { title, showGroupCounts, groups, onJump, onSelectGroup, isFocused } =
    props;
  const groupItemsPromise = usePromise(
    () => (groups ? groups() : Promise.resolve([])),
    [groups]
  );
  const groupItems =
    "value" in groupItemsPromise && groupItemsPromise.value
      ? groupItemsPromise.value
      : null;

  const count = showGroupCounts
    ? groupItems?.find((item) => item.group.title === title)?.group.count
    : undefined;

  const groupHeaderRef = useRef<UIElement>(null);

  useEffect(() => {
    if (isFocused && groupHeaderRef.current) groupHeaderRef.current.focus();
  }, [isFocused]);

  return (
    <Flex
      ref={groupHeaderRef}
      testID="group-header"
      onPress={async (e) => {
        if (e.ctrlKey || e.metaKey) {
          onSelectGroup?.();
          return;
        }
        e.stopPropagation();
        if (!groups || !onJump) return;

        const resolvedGroupItems = groupItems || (await groups());
        const items: MenuItem[] = resolvedGroupItems.map(({ group, index }) => {
          const groupTitle = group.title.toString();
          return {
            type: "button",
            key: groupTitle,
            title: groupTitle,
            onClick: () => onJump(index),
            isChecked: group.title === title
          } satisfies MenuItem;
        });
        if (!items.length) return;

        groupHeaderRef.current?.measureInWindow((x, y, width, height) =>
          Menu.openMenu(items, {
            title: strings.jumpToGroup(),
            position: { x, y, width, height }
          })
        );
      }}
      sx={{
        flexDirection: "row",
        cursor: "pointer",
        px: "spacing6",
        my: "spacing6",
        ":focus": { borderColor: "accent" },
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <Flex
        sx={{ flexDirection: "row", gap: "spacing3", alignItems: "center" }}
      >
        {title ? (
          <Text
            testID="title"
            sx={{
              fontSize: "xs",
              fontWeight: 400,
              color:
                title === strings.conflicted() || title === "Conflicted"
                  ? "paragraph-error"
                  : "accent"
            }}
          >
            {title}
          </Text>
        ) : null}
        {count !== undefined && (
          <>
            <Ellipse size={4} color="accent" />
            <Text sx={{ fontSize: "xs", fontWeight: 400, color: "accent" }}>
              {count}
            </Text>
          </>
        )}
      </Flex>
    </Flex>
  );
}
export default GroupHeader;
