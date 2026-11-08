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

import { useCallback, useEffect, useState } from "react";
import { useResolvedItem } from "@notesnook/common";
import type {
  Color,
  Notebook,
  Tag,
  VirtualizedGrouping
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Box, Button, dataColor, Flex, Text, VirtualList } from "@ui";
import { db } from "../../common/db";
import { CREATE_BUTTON_MAP } from "../../common";
import { navigate, usePathname } from "../../navigation";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { useStore as useReminderStore } from "../../stores/reminder-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import { useStore as useTrashStore } from "../../stores/trash-store";
import { useStore as useMonographStore } from "../../stores/monograph-store";
import { useStore as useUserStore } from "../../stores/user-store";
import {
  Bell,
  BookOpen,
  BoxArrowDown,
  Ellipse,
  FileText,
  Home,
  Notebook as NotebookIcon,
  Plus,
  Sliders,
  Star,
  Tag as TagIcon,
  Trash,
  UserProfileIcon,
  type Icon
} from "../icons";
import { Logo } from "./logo";
import { NavigationItem } from "./navigation-item";
import { TabItem } from "./tab-item";

export type NavigationTabItem = {
  id: "home" | "notebooks" | "tags";
  icon: Icon;
  title: string;
  actions: { id: string; title: string; icon: Icon; onPress: () => void }[];
};

function tabs(): NavigationTabItem[] {
  return [
    { id: "home", icon: Home, title: strings.routes.Home(), actions: [] },
    {
      id: "notebooks",
      icon: NotebookIcon,
      title: strings.routes.Notebooks(),
      actions: [
        {
          id: "notebooks-sort-button",
          title: strings.sortBy(),
          icon: Sliders,
          onPress: () => undefined
        },
        {
          id: "create-notebook-button",
          title: CREATE_BUTTON_MAP.notebooks.title,
          icon: Plus,
          onPress: CREATE_BUTTON_MAP.notebooks.onClick
        }
      ]
    },
    {
      id: "tags",
      icon: TagIcon,
      title: strings.routes.Tags(),
      actions: [
        {
          id: "tags-sort-button",
          title: strings.sortBy(),
          icon: Sliders,
          onPress: () => undefined
        },
        {
          id: "create-tag-button",
          title: CREATE_BUTTON_MAP.tags.title,
          icon: Plus,
          onPress: CREATE_BUTTON_MAP.tags.onClick
        }
      ]
    }
  ];
}

type RouteEntry = {
  id: "notes" | "favorites" | "reminders" | "monographs" | "archive" | "trash";
  title: string;
  path: string;
  icon: Icon;
  loginRequired?: boolean;
};

function routes(): RouteEntry[] {
  return [
    {
      id: "notes",
      title: strings.routes.Notes(),
      path: "/notes",
      icon: FileText
    },
    {
      id: "favorites",
      title: strings.routes.Favorites(),
      path: "/favorites",
      icon: Star
    },
    {
      id: "reminders",
      title: strings.routes.Reminders(),
      path: "/reminders",
      icon: Bell
    },
    {
      id: "monographs",
      title: strings.routes.Monographs(),
      path: "/monographs",
      icon: BookOpen,
      loginRequired: true
    },
    {
      id: "archive",
      title: strings.archive(),
      path: "/archive",
      icon: BoxArrowDown
    },
    { id: "trash", title: strings.routes.Trash(), path: "/trash", icon: Trash }
  ];
}

function Separator() {
  return <Box sx={{ width: "100%", height: 1, bg: "separator" }} />;
}

export function NavigationMenu() {
  const navigationTab = useAppStore((store) => store.navigationTab);
  const setNavigationTab = useAppStore((store) => store.setNavigationTab);
  const allTabs = tabs();
  const currentTab =
    allTabs.find((tab) => tab.id === navigationTab) ?? allTabs[0];

  return (
    <Flex
      testID="navigation-menu-root"
      sx={{
        flexDirection: "column",
        flex: 1,
        bg: "background",
        borderRight: "1px solid",
        borderRightColor: "separator",
        py: "spacing4"
      }}
    >
      <Flex
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "spacing4",
          px: "spacing4"
        }}
      >
        <Flex
          sx={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8
          }}
        >
          <Logo size={25} />
          <Text sx={{ color: "heading", fontSize: 20, fontWeight: 600 }}>
            Notesnook
          </Text>
        </Flex>
        <Flex sx={{ gap: "small", alignItems: "center" }}>
          <ProfileButton />
        </Flex>
      </Flex>
      <Flex sx={{ flexDirection: "column", px: "spacing4" }}>
        <Separator />
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            my: "spacing3"
          }}
        >
          <Flex
            sx={{ flexDirection: "row", alignItems: "center", gap: "spacing2" }}
          >
            {allTabs.map((tab) => (
              <TabItem
                key={tab.id}
                testID={`tab-${tab.id}`}
                icon={tab.icon}
                selected={currentTab.id === tab.id}
                onPress={() => setNavigationTab(tab.id)}
              />
            ))}
          </Flex>
          {currentTab.actions.length > 0 ? (
            <Flex
              sx={{
                flexDirection: "row",
                alignItems: "center",
                gap: "spacing4"
              }}
            >
              {currentTab.actions.map((action) => (
                <Button
                  key={action.id}
                  testID={action.id}
                  variant="tertiary"
                  sx={{ p: 0, bg: "transparent" }}
                  onPress={action.onPress}
                >
                  <action.icon size={15} color="icon-secondary" />
                </Button>
              ))}
            </Flex>
          ) : null}
        </Flex>
        <Separator />
        {currentTab.id === "home" ? (
          <Button
            testID="create-note-button"
            variant="new_accent"
            onPress={CREATE_BUTTON_MAP.notes.onClick}
            sx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "spacing4",
              my: "spacing4",
              px: "spacing4",
              py: "spacing5",
              borderRadius: "radius2",
              fontSize: "sm",
              fontWeight: 600,
              width: "100%"
            }}
          >
            <Plus size={15} color="accentForeground" />
            {strings.newNote()}
          </Button>
        ) : null}
      </Flex>

      <Flex
        testID="navigation-menu"
        sx={{
          flex: 1,
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        {currentTab.id === "home" ? <HomeTab /> : null}
        {currentTab.id === "notebooks" ? <NotebooksTab /> : null}
        {currentTab.id === "tags" ? <TagsTab /> : null}
      </Flex>
    </Flex>
  );
}

function ProfileButton() {
  return (
    <Button
      testID="profile-dropdown"
      variant="secondary"
      sx={{
        width: 32,
        height: 32,
        borderRadius: "radius5",
        border: "1px solid",
        borderColor: "border",
        alignItems: "center",
        p: 0
      }}
    >
      <Flex
        sx={{
          bg: "background-tertiary",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "radius5"
        }}
      >
        <UserProfileIcon size={17} color="icon-secondary" />
      </Flex>
    </Button>
  );
}

function ItemCount(props: { item: RouteEntry | Color; selected?: boolean }) {
  const notes = useNoteStore((store) => store.notes);
  const reminders = useReminderStore((store) => store.reminders);
  const trash = useTrashStore((store) => store.trash);
  const monographs = useMonographStore((store) => store.monographs);
  const [count, setCount] = useState(0);
  const { item } = props;

  useEffect(() => {
    (async function () {
      if ("type" in item) return db.colors.count(item.id);
      switch (item.id) {
        case "notes":
          return notes?.length || 0;
        case "favorites":
          return db.notes.favorites.count();
        case "reminders":
          return reminders?.length || 0;
        case "trash":
          return trash?.length || 0;
        case "monographs":
          return monographs?.length || 0;
        case "archive":
          return db.notes.archived.count();
        default:
          return 0;
      }
    })().then((c) => setCount(c || 0));
  }, [item, notes, trash, monographs, reminders]);

  return (
    <Text
      variant="subBody"
      sx={{
        fontSize: "3xs",
        color: props.selected ? "paragraph" : "paragraph-secondary"
      }}
    >
      {count}
    </Text>
  );
}

function HomeTab() {
  const pathname = usePathname();
  const colors = useAppStore((store) => store.colors);
  const refreshNavItems = useAppStore((store) => store.refreshNavItems);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);

  useEffect(() => {
    refreshNavItems();
  }, [refreshNavItems]);

  return (
    <Flex
      testID="home-tab"
      sx={{ flexDirection: "column", gap: "spacing1", px: "spacing4" }}
    >
      {routes()
        .filter((entry) => (entry.loginRequired ? isLoggedIn : true))
        .map((entry) => {
          const selected = pathname.startsWith(entry.path);
          return (
            <NavigationItem
              key={entry.id}
              title={entry.title}
              icon={entry.icon}
              selected={selected}
              onPress={() => navigate(entry.path, { notify: true })}
            >
              <ItemCount item={entry} selected={selected} />
            </NavigationItem>
          );
        })}
      {colors.length > 0 ? (
        <Box
          sx={{ width: "100%", height: 1, bg: "separator", my: "spacing4" }}
        />
      ) : null}
      {colors.map((color: Color) => (
        <NavigationItem
          key={color.id}
          title={color.title}
          icon={Ellipse}
          iconSize={10}
          color={dataColor(color.colorCode)}
          selected={pathname === `/colors/${color.id}`}
          onPress={() => navigate(`/colors/${color.id}`, { notify: true })}
        >
          <ItemCount item={color} />
        </NavigationItem>
      ))}
    </Flex>
  );
}

function ItemRow<T extends Notebook | Tag>(props: {
  index: number;
  items: VirtualizedGrouping<T>;
  icon: Icon;
  pathPrefix: string;
}) {
  const pathname = usePathname();
  const resolved = useResolvedItem({ index: props.index, items: props.items });
  const item = resolved?.item as T | undefined;
  if (!item) return <Box sx={{ height: 34 }} />;
  const path = `${props.pathPrefix}/${item.id}`;
  return (
    <NavigationItem
      title={item.type === "tag" ? `#${item.title}` : item.title}
      icon={props.icon}
      selected={pathname === path}
      onPress={() => navigate(path, { notify: true })}
    />
  );
}

function NotebooksTab() {
  const notebooks = useNotebookStore((store) => store.notebooks);
  const refresh = useNotebookStore((store) => store.refresh);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const itemKey = useCallback(
    (index: number) => notebooks?.key(index) ?? `${index}`,
    [notebooks]
  );
  const renderItem = useCallback(
    (index: number) =>
      notebooks ? (
        <ItemRow
          index={index}
          items={notebooks}
          icon={NotebookIcon}
          pathPrefix="/notebooks"
        />
      ) : null,
    [notebooks]
  );
  if (!notebooks || notebooks.length === 0)
    return (
      <Flex sx={{ p: "spacing6" }}>
        <Text testID="notebooks-empty" sx={{ color: "paragraph-secondary" }}>
          {strings.noNotebooksYet()}
        </Text>
      </Flex>
    );
  return (
    <Flex testID="notebooks-tab" sx={{ flex: 1, px: "spacing4" }}>
      <VirtualList
        count={notebooks.length}
        itemKey={itemKey}
        estimatedItemSize={34}
        renderItem={renderItem}
      />
    </Flex>
  );
}

function TagsTab() {
  const tags = useTagStore((store) => store.tags);
  const refresh = useTagStore((store) => store.refresh);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const itemKey = useCallback(
    (index: number) => tags?.key(index) ?? `${index}`,
    [tags]
  );
  const renderItem = useCallback(
    (index: number) =>
      tags ? (
        <ItemRow index={index} items={tags} icon={TagIcon} pathPrefix="/tags" />
      ) : null,
    [tags]
  );
  if (!tags || tags.length === 0)
    return (
      <Flex sx={{ p: "spacing6" }}>
        <Text testID="tags-empty" sx={{ color: "paragraph-secondary" }}>
          {strings.noTagsYet()}
        </Text>
      </Flex>
    );
  return (
    <Flex testID="tags-tab" sx={{ flex: 1, px: "spacing4" }}>
      <VirtualList
        count={tags.length}
        itemKey={itemKey}
        estimatedItemSize={34}
        renderItem={renderItem}
      />
    </Flex>
  );
}
