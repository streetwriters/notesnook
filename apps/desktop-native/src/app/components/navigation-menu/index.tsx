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

import { useCallback, useEffect, useRef, useState } from "react";
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
  Input,
  VirtualList,
  type UIElement
} from "@ui";
import { db } from "../../common/db";
import { Notebooks } from "../../views/notebooks";
import { FilterField } from "./filter-field";
import { CREATE_BUTTON_MAP } from "../../common";
import { navigate, usePathname } from "../../navigation";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { useStore as useReminderStore } from "../../stores/reminder-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import { useStore as useTrashStore } from "../../stores/trash-store";
import { useStore as useMonographStore } from "../../stores/monograph-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { useMenuStore } from "../menu";
import {
  Bell,
  BookOpen,
  BoxArrowDown,
  Ellipse,
  FileText,
  Funnel,
  GearSix,
  Home,
  MoonStars,
  Notebook as NotebookIcon,
  Plus,
  Question,
  SignIn,
  SignOut,
  Sliders,
  Star,
  Tag as TagIcon,
  Trash,
  UserProfileIcon,
  type Icon
} from "../icons";
import { UserProfileMinimal } from "../user-profile";
import ListItem from "../list-item";
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
        {currentTab.id === "notebooks" ? <Notebooks /> : null}
        {currentTab.id === "tags" ? <TagsTab /> : null}
      </Flex>
    </Flex>
  );
}

function ProfileButton() {
  const element = useRef<UIElement>(null);
  const colorScheme = useThemeStore((store) => store.colorScheme);
  const user = useUserStore((store) => store.user);
  const notLoggedIn = !user || !user.id;
  const openMenu = useMenuStore((store) => store.open);
  return (
    <Button
      ref={element}
      testID="profile-dropdown"
      variant="secondary"
      onPress={() =>
        element.current?.measureInWindow((x, y, width, height) =>
          openMenu(
            [
              {
                type: "popup",
                key: "profile",
                component: UserProfileMinimal
              },
              { type: "separator", key: "sep" },
              {
                type: "button",
                title: strings.darkMode(),
                key: "toggle-theme-mode",
                iconComponent: MoonStars,
                isChecked: colorScheme === "dark",
                onClick: () =>
                  useThemeStore.setState({
                    colorScheme: colorScheme === "dark" ? "light" : "dark"
                  })
              },
              {
                type: "button",
                title: strings.routes.Settings(),
                key: "settings",
                iconComponent: GearSix
              },
              {
                type: "button",
                title: strings.helpAndSupport(),
                iconComponent: Question,
                key: "help-and-support"
              },
              {
                type: "button",
                title: strings.login(),
                iconComponent: SignIn,
                key: "login",
                isHidden: !notLoggedIn
              },
              {
                type: "button",
                title: strings.logout(),
                iconComponent: SignOut,
                key: "logout",
                isHidden: notLoggedIn
              }
            ],
            { x, y, width, height }
          )
        )
      }
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

function useNoteCount(item: Notebook | Tag | undefined) {
  const [count, setCount] = useState(0);
  const notes = useNoteStore((store) => store.notes);
  useEffect(() => {
    if (!item) return;
    db.relations
      .from(item, "note")
      .count()
      .then((value) => setCount(value || 0));
  }, [item, notes]);
  return count;
}

function NavigationListRow<T extends Notebook | Tag>(props: {
  index: number;
  items: VirtualizedGrouping<T>;
  kind: "notebook" | "tag";
}) {
  const pathname = usePathname();
  const resolved = useResolvedItem({ index: props.index, items: props.items });
  const item = resolved?.item as T | undefined;
  const totalNotes = useNoteCount(item);
  if (!item) return <Box sx={{ height: 33 }} />;
  const path = `/${props.kind}s/${item.id}`;
  const isOpened = pathname === path;
  const RowIcon = props.kind === "notebook" ? NotebookIcon : TagIcon;
  return (
    <ListItem
      item={item}
      isCompact
      isFocused={isOpened}
      onPress={() => navigate(path, { notify: true })}
      sx={{
        borderRadius: "radius1",
        pr: "spacing2",
        pl: "spacing2",
        py: "spacing4",
        mb: props.kind === "notebook" ? "spacing1" : undefined
      }}
      title={
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: "spacing3",
            minWidth: 0
          }}
        >
          {props.kind === "notebook" ? (
            <Box sx={{ width: 11, height: 11 }} />
          ) : null}
          <RowIcon size={13} color={isOpened ? "icon-selected" : "icon"} />
          <Text
            testID="title"
            variant="body"
            numberOfLines={1}
            sx={{
              color: isOpened ? "paragraph-selected" : "paragraph",
              fontWeight: "normal",
              fontSize: "xs",
              minWidth: 0
            }}
          >
            {item.title}
          </Text>
        </Flex>
      }
      footer={
        <Text
          variant="subBody"
          sx={{
            fontSize: "3xs",
            lineHeight: 1,
            color: isOpened ? "paragraph" : "paragraph-secondary"
          }}
        >
          {totalNotes}
        </Text>
      }
    />
  );
}

function NavigationList<T extends Notebook | Tag>(props: {
  kind: "notebook" | "tag";
  items: VirtualizedGrouping<T> | undefined;
  empty: string;
  filter: string;
}) {
  const { items, kind } = props;
  const itemKey = useCallback(
    (index: number) => items?.key(index) ?? `${index}`,
    [items]
  );
  const renderItem = useCallback(
    (index: number) =>
      items ? (
        <NavigationListRow index={index} items={items} kind={kind} />
      ) : null,
    [items, kind]
  );
  return (
    <>
      <Box sx={{ flex: 1, mt: "spacing4" }}>
        {!items || items.length === 0 ? (
          <Flex sx={{ p: "spacing6" }}>
            <Text
              testID={`${kind}s-empty`}
              sx={{ color: "paragraph-secondary" }}
            >
              {props.empty}
            </Text>
          </Flex>
        ) : (
          <Flex testID={`${kind}s-list`} sx={{ flex: 1, px: "spacing4" }}>
            <VirtualList
              count={items.length}
              itemKey={itemKey}
              estimatedItemSize={33}
              renderItem={renderItem}
            />
          </Flex>
        )}
      </Box>
      <FilterField placeholder={props.filter} />
    </>
  );
}

function TagsTab() {
  const tags = useTagStore((store) => store.tags);
  const refresh = useTagStore((store) => store.refresh);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return (
    <NavigationList
      kind="tag"
      items={tags}
      empty={strings.noTagsYet()}
      filter={strings.filterTags()}
    />
  );
}
