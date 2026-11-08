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

import { useCallback, useEffect } from "react";
import { useResolvedItem } from "@notesnook/common";
import type {
  Color,
  Notebook,
  Tag,
  VirtualizedGrouping
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import {
  Box,
  Button,
  dataColor,
  Flex,
  Text,
  TITLE_BAR_HEIGHT,
  VirtualList
} from "@ui";
import { CREATE_BUTTON_MAP } from "../../common";
import { navigate, usePathname } from "../../navigation";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import {
  Archive,
  Bell,
  Book,
  Circle,
  Home,
  Note,
  Notebook as NotebookIcon,
  Plus,
  Settings,
  Sliders,
  Star,
  Tag as TagIcon,
  Trash,
  type Icon
} from "../icons";
import { NavigationItem } from "./navigation-item";
import { TabItem } from "./tab-item";

export type NavigationTabItem = {
  id: "home" | "notebooks" | "tags";
  icon: Icon;
  title: string;
};

function tabs(): NavigationTabItem[] {
  return [
    { id: "home", icon: Home, title: strings.routes.Home() },
    { id: "notebooks", icon: NotebookIcon, title: strings.routes.Notebooks() },
    { id: "tags", icon: TagIcon, title: strings.routes.Tags() }
  ];
}

type RouteEntry = { id: string; title: string; path: string; icon: Icon };

function routes(): RouteEntry[] {
  return [
    { id: "notes", title: strings.routes.Notes(), path: "/notes", icon: Note },
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
      icon: Book
    },
    {
      id: "archive",
      title: strings.archive(),
      path: "/archive",
      icon: Archive
    },
    { id: "trash", title: strings.routes.Trash(), path: "/trash", icon: Trash }
  ];
}

export function NavigationMenu() {
  const navigationTab = useAppStore((store) => store.navigationTab);
  const setNavigationTab = useAppStore((store) => store.setNavigationTab);
  const allTabs = tabs();
  const currentTab =
    allTabs.find((tab) => tab.id === navigationTab) ?? allTabs[0];

  return (
    <Flex
      testID="navigation-menu"
      sx={{
        flexDirection: "column",
        flex: 1,
        bg: "background",
        borderRight: "1px solid",
        borderRightColor: "separator",
        pt: TITLE_BAR_HEIGHT,
        pb: "spacing4"
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: "spacing4",
          px: "spacing4"
        }}
      >
        <Text
          testID="nav-app-name"
          sx={{ color: "heading", fontSize: "lg", fontWeight: 600 }}
        >
          Notesnook
        </Text>
      </Flex>
      <Flex sx={{ flexDirection: "column", px: "spacing4" }}>
        <Box sx={{ width: "100%", height: 1, bg: "separator" }} />
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            my: "spacing3"
          }}
        >
          <Flex sx={{ alignItems: "center", gap: "spacing2" }}>
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
          {currentTab.id !== "home" ? (
            <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
              <Button
                testID={`${currentTab.id}-sort-button`}
                variant="tertiary"
                sx={{ p: 0, bg: "transparent" }}
              >
                <Sliders size="small" color="icon-secondary" />
              </Button>
              <Button
                testID={`create-${currentTab.id}-button`}
                variant="tertiary"
                sx={{ p: 0, bg: "transparent" }}
                onPress={
                  currentTab.id === "notebooks"
                    ? CREATE_BUTTON_MAP.notebooks.onClick
                    : CREATE_BUTTON_MAP.tags.onClick
                }
              >
                <Plus size="small" color="icon-secondary" />
              </Button>
            </Flex>
          ) : null}
        </Flex>
        <Box sx={{ width: "100%", height: 1, bg: "separator" }} />
        {currentTab.id === "home" ? (
          <Button
            testID="create-note-button"
            variant="accent"
            onPress={CREATE_BUTTON_MAP.notes.onClick}
            sx={{
              my: "spacing4",
              px: "spacing4",
              py: "spacing5",
              gap: "spacing4",
              borderRadius: "radius2",
              fontSize: "sm",
              fontWeight: 600,
              width: "100%"
            }}
          >
            <Plus size="small" color="accentForeground" />
            {strings.newNote()}
          </Button>
        ) : null}
      </Flex>

      <Flex sx={{ flex: 1, flexDirection: "column", overflow: "hidden" }}>
        {currentTab.id === "home" ? <HomeTab /> : null}
        {currentTab.id === "notebooks" ? <NotebooksTab /> : null}
        {currentTab.id === "tags" ? <TagsTab /> : null}
      </Flex>
      <Flex sx={{ flexDirection: "column", px: "spacing4" }}>
        <NavigationItem
          testID="nav-settings"
          title={strings.routes.Settings()}
          icon={Settings}
          selected={false}
        />
      </Flex>
    </Flex>
  );
}

function HomeTab() {
  const pathname = usePathname();
  const colors = useAppStore((store) => store.colors);
  const refreshNavItems = useAppStore((store) => store.refreshNavItems);

  useEffect(() => {
    refreshNavItems();
  }, [refreshNavItems]);

  return (
    <Flex
      testID="home-tab"
      sx={{ flexDirection: "column", gap: "spacing1", px: "spacing4" }}
    >
      {routes().map((entry) => (
        <NavigationItem
          key={entry.id}
          testID={`nav-${entry.id}`}
          title={entry.title}
          icon={entry.icon}
          selected={pathname.startsWith(entry.path)}
          onPress={() => navigate(entry.path, { notify: true })}
        />
      ))}
      {colors.map((color: Color) => (
        <NavigationItem
          key={color.id}
          testID={`nav-color-${color.title}`}
          title={color.title}
          icon={Circle}
          iconColor={dataColor(color.colorCode)}
          selected={pathname === `/colors/${color.id}`}
          onPress={() => navigate(`/colors/${color.id}`, { notify: true })}
        />
      ))}
    </Flex>
  );
}

function ItemRow<T extends Notebook | Tag>(props: {
  index: number;
  items: VirtualizedGrouping<T>;
  icon: Icon;
  pathPrefix: string;
  testPrefix: string;
}) {
  const pathname = usePathname();
  const resolved = useResolvedItem({ index: props.index, items: props.items });
  const item = resolved?.item as T | undefined;
  if (!item) return <Box sx={{ height: 34 }} />;
  const path = `${props.pathPrefix}/${item.id}`;
  return (
    <NavigationItem
      testID={`${props.testPrefix}-${item.title}`}
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
          testPrefix="notebook"
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
        itemKey={(index) => notebooks.key(index)}
        estimatedItemSize={34}
        renderItem={(index) => (
          <ItemRow
            index={index}
            items={notebooks}
            icon={NotebookIcon}
            pathPrefix="/notebooks"
            testPrefix="notebook"
          />
        )}
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
        <ItemRow
          index={index}
          items={tags}
          icon={TagIcon}
          pathPrefix="/tags"
          testPrefix="tag"
        />
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
        itemKey={(index) => tags.key(index)}
        estimatedItemSize={34}
        renderItem={(index) => (
          <ItemRow
            index={index}
            items={tags}
            icon={TagIcon}
            pathPrefix="/tags"
            testPrefix="tag"
          />
        )}
      />
    </Flex>
  );
}
