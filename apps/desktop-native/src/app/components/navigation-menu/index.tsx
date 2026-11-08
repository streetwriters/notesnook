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

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FeatureResult,
  isFeatureAvailable,
  useIsFeatureAvailable
} from "@notesnook/common";
import { createInternalLink } from "@notesnook/core";
import type { Color, Notebook, Tag } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { shell } from "@platform";
import {
  Box,
  Button,
  dataColor,
  Flex,
  Image,
  ScrollContainer,
  SortableList,
  Text,
  type MenuItem,
  type UIElement
} from "@ui";
import { db } from "../../common/db";
import { handleDrop } from "../../common/drop-handler";
import { Notebooks } from "../../views/notebooks";
import Tags from "../../views/tags";
import {
  checkFeature,
  CREATE_BUTTON_MAP,
  createSetDefaultHomepageMenuItem,
  logout,
  withFeatureCheck
} from "../../common";
import {
  getCurrentPath,
  hardNavigate,
  hashNavigate,
  navigate,
  NavigationEvents,
  usePathname
} from "../../navigation";
import { isMobile } from "../../hooks/use-mobile";
import { Menu } from "../../hooks/use-menu";
import { useMenuStore } from "../menu/store";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { isUserSubscribed } from "../../hooks/use-is-user-premium";
import { shouldShowWrapped } from "../../utils/should-show-wrapped";
import { writeToClipboard } from "../../utils/clipboard";
import { showToast } from "../../utils/toast";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { useStore as useReminderStore } from "../../stores/reminder-store";
import { useStore as useSearchStore } from "../../stores/search-store";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import { useStore as useTrashStore } from "../../stores/trash-store";
import { useStore as useMonographStore } from "../../stores/monograph-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { ConfirmDialog } from "../../dialogs/confirm";
import { RenameColorDialog } from "../../dialogs/item-dialog";
import { BuyDialog } from "../../dialogs/buy-dialog";
import {
  ArrowCounterClockwise,
  Backspace,
  Bell,
  BookOpen,
  BoxArrowDown,
  Ellipse,
  ExpandSidebar,
  FileText,
  GearSix,
  Home,
  LinkBreak,
  LinkHorizontal,
  MoonStars,
  Notebook as NotebookIcon,
  PencilSimple,
  Plus,
  Pro,
  Question,
  SignIn,
  SignOut,
  Sliders,
  Star,
  Tag as TagIcon,
  Topic,
  Trash,
  UserProfileIcon,
  type Icon
} from "../icons";
import { showSortMenu } from "../group-header";
import { UserProfileMinimal } from "../user-profile";
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
          onPress: () =>
            showSortMenu("notebooks", () =>
              useNotebookStore.getState().refresh()
            )
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
          onPress: () =>
            showSortMenu("tags", () => useTagStore.getState().refresh())
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

export function NavigationMenu(props: {
  onExpand?: () => void;
  canExpand?: boolean;
}) {
  const { onExpand, canExpand = true } = props;
  const isNavPaneCollapsed = useAppStore((store) => store.isNavPaneCollapsed);
  const [expanded, setExpanded] = useState(false);
  const isCollapsed = isNavPaneCollapsed && !expanded;
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    if (isNavPaneCollapsed) setExpanded(false);
  }, [isNavPaneCollapsed]);

  useEffect(() => {
    const event = NavigationEvents.subscribe("onNavigate", () => {
      if (!useAppStore.getState().isNavPaneCollapsed) return;
      setExpanded(false);
    });
    return () => {
      event.unsubscribe();
    };
  }, []);

  const navigationTab = useAppStore((store) => store.navigationTab);
  const setNavigationTab = useAppStore((store) => store.setNavigationTab);
  const allTabs = tabs();
  const currentTab =
    allTabs.find((tab) => tab.id === navigationTab) ?? allTabs[0];

  return (
    <Flex
      testID="navigation-menu-root"
      onHoverIn={() => clearTimeout(hoverTimeout.current)}
      onHoverOut={() => {
        clearTimeout(hoverTimeout.current);
        if (!isNavPaneCollapsed) return;
        hoverTimeout.current = setTimeout(() => {
          if (Menu.isOpen()) {
            const unsubscribe = useMenuStore.subscribe((state) => {
              if (state.items) return;
              unsubscribe();
              setExpanded(false);
            });
            return;
          }
          setExpanded(false);
        }, 500);
      }}
      sx={{
        flexDirection: "column",
        flex: 1,
        ...(isNavPaneCollapsed
          ? {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: 3,
              width: expanded ? 250 : 45
            }
          : {}),
        bg: "background",
        borderRight: "1px solid",
        borderRightColor: "separator",
        py: "spacing4"
      }}
    >
      {isCollapsed ? (
        <Flex
          sx={{
            justifyContent: "center",
            alignItems: "center",
            mb: "spacing4",
            px: "spacing4"
          }}
        >
          <Logo size={24} />
        </Flex>
      ) : (
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
          <Flex
            sx={{
              flexDirection: "row",
              gap: "small",
              alignItems: "center"
            }}
          >
            {isNavPaneCollapsed ? (
              <Button
                variant="secondary"
                title={strings.expandSidebar()}
                disabled={!canExpand}
                onPress={onExpand}
                sx={{ p: 1, bg: "transparent" }}
              >
                <ExpandSidebar size={13} color="icon" />
              </Button>
            ) : null}
            <ProfileButton />
          </Flex>
        </Flex>
      )}
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
            sx={{
              flexDirection: isCollapsed ? "column" : "row",
              alignItems: "center",
              gap: "spacing2"
            }}
          >
            {allTabs.map((tab) => (
              <TabItem
                key={tab.id}
                testID={`tab-${tab.id}`}
                icon={tab.icon}
                selected={currentTab.id === tab.id}
                isCollapsed={isCollapsed}
                onPress={() => {
                  if (isNavPaneCollapsed) setExpanded(true);
                  setNavigationTab(tab.id);
                }}
              />
            ))}
          </Flex>
          {!isCollapsed && currentTab.actions.length > 0 ? (
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
        {isCollapsed || currentTab.id === "home" ? (
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
              py: isCollapsed ? "spacing4" : "spacing5",
              borderRadius: isCollapsed ? "radius1" : "radius2",
              fontSize: "sm",
              fontWeight: 600,
              width: isCollapsed ? 25 : "100%",
              height: isCollapsed ? 25 : undefined
            }}
          >
            <Plus size={15} color="accentForeground" />
            {isCollapsed ? null : strings.newNote()}
          </Button>
        ) : null}
      </Flex>

      <Flex
        testID="navigation-menu"
        onContextMenu={async (event) => {
          event.preventDefault();
          Menu.openMenu(await getSidebarItemsAsMenuItems(), {
            position: { x: event.pageX, y: event.pageY }
          });
        }}
        sx={{
          flex: 1,
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        {isCollapsed || currentTab.id === "home" ? (
          <HomeTab
            isCollapsed={isCollapsed}
            collapse={() => isNavPaneCollapsed && setExpanded(false)}
          />
        ) : null}
        {!isCollapsed && currentTab.id === "notebooks" ? <Notebooks /> : null}
        {!isCollapsed && currentTab.id === "tags" ? <Tags /> : null}
      </Flex>
      {currentTab.id === "home" && !isCollapsed && shouldShowWrapped() ? (
        <Button
          variant="accent"
          testID="wrapped-button"
          onPress={() => hardNavigate("/wrapped")}
          sx={{ m: 2 }}
        >
          <Text sx={{ color: "accentForeground" }}>
            {strings.wrappedTitle(new Date().getFullYear())}
          </Text>
        </Button>
      ) : null}
    </Flex>
  );
}

function ProfileButton() {
  const element = useRef<UIElement>(null);
  const colorScheme = useThemeStore((store) => store.colorScheme);
  const user = useUserStore((store) => store.user);
  const profile = useSettingStore((store) => store.profile);
  const isSubscribed = useMemo(() => isUserSubscribed(user), [user]);
  const notLoggedIn = !user || !user.id;
  return (
    <Button
      ref={element}
      testID="profile-dropdown"
      variant="secondary"
      onPress={() =>
        element.current?.measureInWindow((x, y, width, height) =>
          Menu.openMenu(
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
                onClick: () => {
                  useThemeStore.getState().setFollowSystemTheme(false);
                  useThemeStore.getState().toggleColorScheme();
                }
              },
              {
                type: "button",
                title: strings.upgradeToPro(),
                iconComponent: Pro,
                key: "upgrade",
                onClick: () => BuyDialog.show({}),
                isHidden: notLoggedIn || !isSubscribed
              },
              {
                type: "button",
                title: strings.routes.Settings(),
                key: "settings",
                iconComponent: GearSix,
                onClick: () => hashNavigate("/settings")
              },
              {
                type: "button",
                title: strings.helpAndSupport(),
                iconComponent: Question,
                key: "help-and-support",
                onClick: () => shell.openUrl("https://notesnook.com/help/")
              },
              {
                type: "button",
                title: strings.login(),
                iconComponent: SignIn,
                key: "login",
                isHidden: !notLoggedIn,
                onClick: () => hardNavigate("/login")
              },
              {
                type: "button",
                title: strings.logout(),
                iconComponent: SignOut,
                key: "logout",
                isHidden: notLoggedIn,
                onClick: () => logout()
              }
            ],
            { position: { x, y, width, height } }
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
      {!user || !user.id || !profile?.profilePicture ? (
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
      ) : (
        <Image
          src={profile.profilePicture}
          resizeMode="contain"
          sx={{ width: "100%", height: "100%", borderRadius: "radius5" }}
        />
      )}
    </Button>
  );
}

type SectionContext = { collapse: () => void; isCollapsed?: boolean };

function navigateToRoute(path: string) {
  if (!isMobile() && getCurrentPath() === path) {
    if (useSearchStore.getState().isSearching)
      return useSearchStore.getState().resetSearch();
    return useAppStore.getState().toggleListPane();
  }
  useAppStore.getState().toggleListPane(true);
  navigate(path, { notify: true });
}

type ReorderableListProps<T> = {
  orderKey: string;
  items: T[];
  visibleItemLimit?: number;
  renderItem: (item: T) => ReactNode;
  onOrderChanged: (newOrder: string[]) => void;
  order: () => string[];
};

function ReorderableList<T extends { id: string }>(
  props: ReorderableListProps<T>
) {
  const {
    orderKey,
    items,
    visibleItemLimit,
    renderItem,
    onOrderChanged,
    order: _order
  } = props;
  const [order, setOrder] = usePersistentState<string[]>(orderKey, _order());
  const customizableSidebar = useIsFeatureAvailable("customizableSidebar");
  const orderedItems = customizableSidebar?.isAllowed
    ? orderItems(items, order)
    : items;
  const renderedItems = visibleItemLimit
    ? orderedItems.slice(0, visibleItemLimit)
    : orderedItems;

  useEffect(() => {
    setOrder(_order());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SortableList
      items={renderedItems}
      onMove={async ({ activeId, overId }) => {
        if (
          !customizableSidebar ||
          !(await checkFeature(customizableSidebar)) ||
          activeId === overId
        )
          return;
        const transitionOrder =
          order.length === 0 || order.length !== orderedItems.length
            ? orderedItems.map((i) => i.id)
            : order;
        const newIndex = transitionOrder.indexOf(overId);
        const oldIndex = transitionOrder.indexOf(activeId);
        if (newIndex < 0 || oldIndex < 0) return;
        const newOrder = transitionOrder.slice();
        newOrder.splice(newIndex, 0, newOrder.splice(oldIndex, 1)[0]);
        setOrder(newOrder);
        onOrderChanged(newOrder);
      }}
      renderItem={(item, state) => (
        <Flex sx={{ opacity: state.isDragging ? 0.4 : 1 }}>
          {renderItem(item)}
        </Flex>
      )}
    />
  );
}

function orderItems<T extends { id: string }>(items: T[], order: string[]) {
  const sorted: T[] = [];
  order.forEach((id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    sorted.push(item);
  });
  sorted.push(...items.filter((i) => !order.includes(i.id)));
  return sorted;
}

function toMenuItems<T extends { id: string; title: string }>(
  items: T[],
  hiddenIds: string[],
  onHiddenIdsUpdated: (ids: string[]) => void,
  customizableSidebar: FeatureResult<"customizableSidebar">,
  extraProps?: (item: T) => Partial<MenuItem>
): MenuItem[] {
  return items.map((item) => ({
    ...extraProps?.(item),
    type: "button",
    key: item.id,
    title: item.title,
    isChecked: !hiddenIds.includes(item.id),
    premium: !customizableSidebar.isAllowed,
    onClick: withFeatureCheck(customizableSidebar, async () => {
      const copy = hiddenIds.slice();
      const index = copy.indexOf(item.id);
      if (index > -1) copy.splice(index, 1);
      else copy.push(item.id);
      onHiddenIdsUpdated(copy);
    })
  })) as MenuItem[];
}

async function getSidebarItemsAsMenuItems(): Promise<MenuItem[]> {
  const customizableSidebar = await isFeatureAvailable("customizableSidebar");
  const colors = useAppStore.getState().colors;
  const hiddenColors = customizableSidebar.isAllowed
    ? useAppStore.getState().hiddenColors
    : [];
  const hiddenRoutes = customizableSidebar.isAllowed
    ? useAppStore.getState().hiddenRoutes
    : [];
  return [
    {
      key: "reset-sidebar",
      type: "button",
      title: strings.resetSidebar(),
      onClick: () => {
        db.settings
          .setSideBarHiddenItems("routes", [])
          .then(() => db.settings.setSideBarHiddenItems("colors", []))
          .then(() => db.settings.setSideBarOrder("colors", []))
          .then(() => db.settings.setSideBarOrder("routes", []))
          .then(() => db.settings.setSideBarOrder("shortcuts", []))
          .then(() => {
            useAppStore.getState().setHiddenRoutes([]);
            useAppStore.getState().setHiddenColors([]);
          });
      },
      iconComponent: ArrowCounterClockwise
    },
    { type: "separator", key: "sep" },
    ...toMenuItems(
      orderItems(routes(), db.settings.getSideBarOrder("routes")),
      hiddenRoutes,
      (ids) =>
        db.settings
          .setSideBarHiddenItems("routes", ids)
          .then(() => useAppStore.getState().setHiddenRoutes(ids)),
      customizableSidebar,
      (item) => ({ iconComponent: item.icon })
    ),
    { type: "separator", key: "sep-colors", isHidden: colors.length <= 0 },
    ...toMenuItems(
      orderItems(colors, db.settings.getSideBarOrder("colors")),
      hiddenColors,
      (ids) =>
        db.settings
          .setSideBarHiddenItems("colors", ids)
          .then(() => useAppStore.getState().setHiddenColors(ids)),
      customizableSidebar,
      (item) => ({ iconComponent: createColorIcon(item.colorCode) })
    )
  ] as MenuItem[];
}

function createColorIcon(colorCode: string): Icon {
  const color = dataColor(colorCode);
  return function ColorIcon(props) {
    return <Ellipse {...props} color={color} />;
  };
}

function ItemCount(props: {
  item: RouteEntry | Color | Notebook | Tag;
  selected?: boolean;
}) {
  const notes = useNoteStore((store) => store.notes);
  const reminders = useReminderStore((store) => store.reminders);
  const trash = useTrashStore((store) => store.trash);
  const monographs = useMonographStore((store) => store.monographs);
  const [count, setCount] = useState(0);
  const { item } = props;

  useEffect(() => {
    (async function () {
      if ("type" in item) {
        if (item.type === "color") return db.colors.count(item.id);
        else if (item.type === "notebook" || item.type === "tag")
          return db.relations.from(item, "note").count();
      } else {
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

function Routes({ collapse, isCollapsed }: SectionContext) {
  const customizableSidebar = useIsFeatureAvailable("customizableSidebar");
  const hiddenRoutes = useAppStore((store) => store.hiddenRoutes);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const visible = routes()
    .filter(
      customizableSidebar?.isAllowed
        ? (r) => !hiddenRoutes.includes(r.id)
        : () => true
    )
    .filter((r) => (r.loginRequired ? isLoggedIn : true));
  return (
    <ReorderableList
      items={visible}
      orderKey="sidebarOrder:routes"
      order={() => db.settings.getSideBarOrder("routes")}
      onOrderChanged={(order) => db.settings.setSideBarOrder("routes", order)}
      renderItem={(item) => (
        <RouteItem item={item} collapse={collapse} isCollapsed={isCollapsed} />
      )}
    />
  );
}

function RouteItem({
  item,
  collapse,
  isCollapsed
}: SectionContext & {
  item: RouteEntry;
}) {
  const pathname = usePathname();
  const trash = useTrashStore((store) => store.trash);
  const selected =
    item.path === "/" ? pathname === item.path : pathname.startsWith(item.path);

  return (
    <NavigationItem
      title={item.title}
      icon={item.icon}
      isCollapsed={isCollapsed}
      selected={selected}
      onDrop={(event) =>
        handleDrop(event.payload, {
          type:
            item.path === "/trash"
              ? "trash"
              : item.path === "/favorites"
              ? "favorites"
              : item.path == "/archive"
              ? "archive"
              : undefined
        })
      }
      onPress={() => {
        navigateToRoute(item.path);
        collapse();
      }}
      menuItems={[
        ...(item.id === "trash"
          ? [
              {
                type: "button" as const,
                key: "clear-trash",
                title: strings.clearTrash(),
                isDisabled: !trash || trash.length === 0,
                iconComponent: Trash,
                onClick: async () => {
                  const ok = await ConfirmDialog.show({
                    title: strings.clearTrash(),
                    positiveButtonText: strings.clear(),
                    negativeButtonText: strings.cancel(),
                    subtitle: strings.clearTrashDesc(),
                    positiveButtonVariant: "new_error"
                  });
                  if (!ok) return;

                  try {
                    await useTrashStore.getState().clear();
                    showToast("success", strings.trashCleared());
                  } catch (e) {
                    if (e instanceof Error)
                      showToast(
                        "error",
                        `${strings.couldNotClearTrash()} ${strings.error()}: ${
                          e.message
                        }`
                      );
                  }
                }
              }
            ]
          : []),
        {
          type: "lazy-loader",
          key: "sidebar-homepage-loader",
          items: async () => [
            createSetDefaultHomepageMenuItem(
              item.id,
              "route",
              await isFeatureAvailable("customHomepage")
            )
          ]
        },
        { type: "separator", key: "sep32" },
        {
          type: "lazy-loader",
          key: "sidebar-items-loader",
          items: getSidebarItemsAsMenuItems
        }
      ]}
    >
      <ItemCount item={item} selected={selected} />
    </NavigationItem>
  );
}

function Colors({ collapse, isCollapsed }: SectionContext) {
  const customizableSidebar = useIsFeatureAvailable("customizableSidebar");
  const colors = useAppStore((store) => store.colors);
  const hiddenColors = useAppStore((store) => store.hiddenColors);
  const [showAllColors, setShowAllColors] = useState(false);
  const visibleColors = customizableSidebar?.isAllowed
    ? colors.filter((c: Color) => !hiddenColors.includes(c.id))
    : colors;
  const hasMoreColors = visibleColors.length > 6;

  if (colors.length === 0) return null;
  return (
    <>
      <Box sx={{ width: "100%", height: 1, bg: "separator", my: "spacing4" }} />
      <ReorderableList
        items={visibleColors as Color[]}
        visibleItemLimit={showAllColors ? undefined : 6}
        orderKey="sidebarOrder:colors"
        order={() => db.settings.getSideBarOrder("colors")}
        onOrderChanged={(order) => db.settings.setSideBarOrder("colors", order)}
        renderItem={(color) => (
          <ColorItem
            color={color}
            collapse={collapse}
            isCollapsed={isCollapsed}
          />
        )}
      />
      {hasMoreColors ? (
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            px: "spacing2",
            minHeight: 13,
            mt: "spacing3"
          }}
        >
          <Text variant="body" sx={{ fontSize: "xs" }}>
            {showAllColors ? "" : `+${visibleColors.length - 6} more`}
          </Text>
          <Button
            onPress={() => setShowAllColors((expanded) => !expanded)}
            sx={{
              color: "accent",
              fontSize: "xs",
              fontWeight: "medium",
              lineHeight: 1,
              p: 0
            }}
          >
            <Text
              sx={{ color: "accent", fontSize: "xs", fontWeight: "medium" }}
            >
              {showAllColors ? strings.viewLess() : strings.viewAll()}
            </Text>
          </Button>
        </Flex>
      ) : null}
    </>
  );
}

function ColorItem({
  color,
  collapse,
  isCollapsed
}: SectionContext & { color: Color }) {
  const currentContext = useNoteStore((store) =>
    store.context?.type === "color" ? store.context : null
  );
  return (
    <NavigationItem
      title={color.title}
      isCollapsed={isCollapsed}
      icon={Ellipse}
      iconSize={10}
      selected={currentContext?.id === color.id}
      onDrop={(event) => handleDrop(event.payload, color)}
      color={dataColor(color.colorCode)}
      onPress={() => {
        navigateToRoute(`/colors/${color.id}`);
        collapse();
      }}
      menuItems={[
        {
          type: "button",
          key: "rename-color",
          title: strings.renameColor(),
          onClick: () => RenameColorDialog.show(color),
          iconComponent: PencilSimple
        },
        {
          type: "button",
          key: "remove-color",
          title: strings.removeColor(),
          onClick: async () => {
            await db.colors.remove(color.id);
            await useAppStore.getState().refreshNavItems();
          },
          iconComponent: Backspace
        },
        {
          type: "button",
          key: "copy-link",
          title: strings.copyLink(),
          onClick: () => {
            const link = createInternalLink("color", color.id);
            writeToClipboard({
              "text/plain": link,
              "text/html": `<a href="${link}">${color.title}</a>`,
              "text/markdown": `[${color.title}](${link})`
            });
          },
          iconComponent: LinkHorizontal
        },
        {
          type: "lazy-loader",
          key: "sidebar-homepage-loader",
          items: async () => [
            createSetDefaultHomepageMenuItem(
              color.id,
              color.type,
              await isFeatureAvailable("customHomepage")
            )
          ]
        },
        { type: "separator", key: "sep32" },
        {
          type: "lazy-loader",
          key: "sidebar-items-loader",
          items: getSidebarItemsAsMenuItems
        }
      ]}
    >
      <ItemCount item={color} />
    </NavigationItem>
  );
}

function Shortcuts({ collapse, isCollapsed }: SectionContext) {
  const shortcuts = useAppStore((store) => store.shortcuts);
  if (shortcuts.length === 0) return null;
  return (
    <>
      <Box sx={{ width: "100%", height: 1, bg: "separator", my: "spacing4" }} />
      <ReorderableList
        items={shortcuts as (Notebook | Tag)[]}
        orderKey="sidebarOrder:shortcuts"
        order={() => db.settings.getSideBarOrder("shortcuts")}
        onOrderChanged={(order) =>
          db.settings.setSideBarOrder("shortcuts", order)
        }
        renderItem={(item) => (
          <ShortcutItem
            item={item}
            collapse={collapse}
            isCollapsed={isCollapsed}
          />
        )}
      />
    </>
  );
}

function ShortcutItem({
  item,
  collapse,
  isCollapsed
}: SectionContext & { item: Notebook | Tag }) {
  const currentContext = useNoteStore((store) =>
    store.context?.type === "tag" || store.context?.type === "notebook"
      ? store.context
      : null
  );

  return (
    <NavigationItem
      title={item.title}
      isCollapsed={isCollapsed}
      menuItems={[
        {
          type: "lazy-loader",
          key: "sidebar-homepage-loader",
          items: async () => [
            createSetDefaultHomepageMenuItem(
              item.id,
              item.type,
              await isFeatureAvailable("customHomepage")
            )
          ]
        },
        {
          type: "button",
          key: "removeshortcut",
          title: strings.doActions.remove.shortcut(1),
          iconComponent: LinkBreak,
          onClick: async () => {
            await db.shortcuts.remove(item.id);
            useAppStore.getState().refreshNavItems();
          }
        }
      ]}
      icon={
        item.type === "notebook"
          ? NotebookIcon
          : item.type === "tag"
          ? TagIcon
          : Topic
      }
      iconSize={14}
      selected={currentContext?.id === item.id}
      onDrop={(event) => handleDrop(event.payload, item)}
      onPress={() => {
        navigateToRoute(
          item.type === "notebook"
            ? `/notebooks/${item.id}`
            : `/tags/${item.id}`
        );
        collapse();
      }}
    >
      <ItemCount item={item} />
    </NavigationItem>
  );
}

function HomeTab(props: { isCollapsed?: boolean; collapse: () => void }) {
  const refreshNavItems = useAppStore((store) => store.refreshNavItems);

  useEffect(() => {
    refreshNavItems();
  }, [refreshNavItems]);

  return (
    <ScrollContainer>
      <Flex
        testID="home-tab"
        sx={{
          flexDirection: "column",
          gap: "spacing1",
          px: "spacing4",
          width: "100%"
        }}
      >
        <Routes collapse={props.collapse} isCollapsed={props.isCollapsed} />
        <Colors collapse={props.collapse} isCollapsed={props.isCollapsed} />
        <Shortcuts collapse={props.collapse} isCollapsed={props.isCollapsed} />
      </Flex>
    </ScrollContainer>
  );
}
