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

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Flex, Image, Text } from "@theme-ui/components";
import {
  Note,
  Notebook as NotebookIcon,
  StarOutline,
  Monographs,
  Tag as TagIcon,
  Trash,
  Settings,
  Notebook2,
  Tag2,
  Topic,
  DarkMode,
  LightMode,
  Login,
  Circle,
  Icon,
  Reminders,
  User,
  Home,
  Pro,
  Documentation,
  Logout,
  Plus,
  SortBy,
  Reset,
  Rename,
  ColorRemove,
  ExpandSidebar,
  HamburgerMenu
} from "../icons";
import { SortableNavigationItem } from "./navigation-item";
import {
  getCurrentPath,
  hardNavigate,
  hashNavigate,
  navigate
} from "../../navigation";
import { db } from "../../common/db";
import { isMobile } from "../../hooks/use-mobile";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useReminderStore } from "../../stores/reminder-store";
import { useStore as useMonographStore } from "../../stores/monograph-store";
import { useStore as useTrashStore } from "../../stores/trash-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import { useStore as useSearchStore } from "../../stores/search-store";
import useLocation from "../../hooks/use-location";
import { FlexScrollContainer } from "../scroll-container";
import { ScopedThemeProvider } from "../theme-provider";
import {
  closestCenter,
  DndContext,
  useSensor,
  useSensors,
  KeyboardSensor,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { usePersistentState } from "../../hooks/use-persistent-state";
import { MenuItem } from "@notesnook/ui";
import { Color, Notebook, Tag } from "@notesnook/core";
import { handleDrop } from "../../common/drop-handler";
import { Menu } from "../../hooks/use-menu";
import { RenameColorDialog } from "../../dialogs/item-dialog";
import { strings } from "@notesnook/intl";
import Tags from "../../views/tags";
import { Notebooks } from "../../views/notebooks";
import { UserProfile } from "../../dialogs/settings/components/user-profile";
import { SUBSCRIPTION_STATUS } from "../../common/constants";
import { CREATE_BUTTON_MAP, logout } from "../../common";
import { TabItem } from "./tab-item";
import Notice from "../notice";
import { usePromise } from "@notesnook/common";
import { showSortMenu } from "../group-header";
import { Freeze } from "react-freeze";

type Route = {
  id: "notes" | "favorites" | "reminders" | "monographs" | "trash";
  title: string;
  path: string;
  icon: Icon;
  tag?: string;
};

const routes: Route[] = [
  { id: "notes", title: strings.routes.Notes(), path: "/notes", icon: Note },
  {
    id: "favorites",
    title: strings.routes.Favorites(),
    path: "/favorites",
    icon: StarOutline
  },
  {
    id: "reminders",
    title: strings.routes.Reminders(),
    path: "/reminders",
    icon: Reminders
  },
  {
    id: "monographs",
    title: strings.routes.Monographs(),
    path: "/monographs",
    icon: Monographs
  },
  { id: "trash", title: strings.routes.Trash(), path: "/trash", icon: Trash }
];

const tabs = [
  {
    id: "home",
    icon: Home,
    title: strings.routes.Home(),
    actions: []
  },
  {
    id: "notebooks",
    icon: NotebookIcon,
    title: strings.routes.Notebooks(),
    actions: [
      {
        id: "create-notebook-button",
        title: CREATE_BUTTON_MAP.notebooks.title,
        icon: Plus,
        onClick: CREATE_BUTTON_MAP.notebooks.onClick
      },
      {
        id: "notebooks-sort-button",
        title: strings.sortBy(),
        icon: SortBy,
        onClick: () =>
          showSortMenu("notebooks", () => useNotebookStore.getState().refresh())
      }
    ]
  },
  {
    id: "tags",
    icon: TagIcon,
    title: strings.routes.Tags(),
    actions: [
      {
        id: "create-tag-button",
        title: CREATE_BUTTON_MAP.tags.title,
        icon: Plus,
        onClick: CREATE_BUTTON_MAP.tags.onClick
      },
      {
        id: "tags-sort-button",
        title: strings.sortBy(),
        icon: SortBy,
        onClick: () =>
          showSortMenu("tags", () => useTagStore.getState().refresh())
      }
    ]
  }
] as const;

const settings = {
  id: "settings",
  title: strings.routes.Settings(),
  path: "/settings",
  icon: Settings
} as const;

function NavigationMenu({ onExpand }: { onExpand?: () => void }) {
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const [currentTab, setCurrentTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const isNavPaneCollapsed = useAppStore((store) => store.isNavPaneCollapsed);
  const [expanded, setExpanded] = useState(false);
  const isCollapsed = isNavPaneCollapsed && !expanded;
  const mouseHoverTimeout = useRef(0);

  useEffect(() => {
    if (isNavPaneCollapsed) setExpanded(false);
  }, [isNavPaneCollapsed]);

  return (
    <ScopedThemeProvider
      scope="navigationMenu"
      id="navigation-menu"
      sx={{
        display: isFocusMode ? "none" : "flex",
        zIndex: 1,
        position: "relative",
        flex: 1,
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bg: "background",
        borderRight: "1px solid var(--separator)",
        pt: 1,
        transition: "width 0.1s ease-in",
        width: isNavPaneCollapsed ? (expanded ? 250 : 50) : "100%"
      }}
      onMouseEnter={() => {
        clearTimeout(mouseHoverTimeout.current);
      }}
      onMouseLeave={() => {
        clearTimeout(mouseHoverTimeout.current);
        if (!isNavPaneCollapsed) return;
        mouseHoverTimeout.current = setTimeout(() => {
          if (!isNavPaneCollapsed) return;
          setExpanded(false);
        }, 500) as unknown as number;
      }}
    >
      {isCollapsed ? (
        <Button
          variant="secondary"
          sx={{ p: 1, px: "small", bg: "transparent", mx: 1 }}
          onClick={() => setExpanded(true)}
        >
          <HamburgerMenu size={16} color="icon" />
        </Button>
      ) : (
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            mx: 1
          }}
        >
          <Flex
            sx={{
              flexDirection: "row",
              alignItems: "center",
              gap: 2
            }}
          >
            <svg
              style={{
                width: 25,
                height: 25
              }}
            >
              <use href="#full-logo" />
            </svg>

            <Text
              variant="heading"
              sx={{
                fontSize: 18,
                fontWeight: "medium",
                display: "block"
              }}
            >
              Notesnook
            </Text>
          </Flex>
          <Flex sx={{ gap: "small", alignItems: "center" }}>
            {isNavPaneCollapsed ? (
              <Button
                variant="secondary"
                sx={{ p: 1, bg: "transparent" }}
                onClick={onExpand}
                title={strings.expandSidebar()}
              >
                <ExpandSidebar size={13} color="icon" />
              </Button>
            ) : null}
            <NavigationDropdown />
          </Flex>
        </Flex>
      )}
      <Flex
        sx={{
          justifyContent: isCollapsed ? "center" : "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--separator)",
          borderBottom: "1px solid var(--separator)",
          mt: 1,
          mb: 1,
          px: 1,
          py: 1
        }}
      >
        <Flex
          sx={{
            flexDirection: isCollapsed ? "column" : "row",
            alignItems: isCollapsed ? "stretch" : "center",
            gap: "small",
            flex: 1
          }}
        >
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              data-test-id={`tab-${tab.id}`}
              title={tab.title}
              icon={tab.icon}
              selected={currentTab.id === tab.id}
              onClick={() => {
                if (isNavPaneCollapsed) setExpanded(true);
                setCurrentTab(tab);
              }}
            />
          ))}
        </Flex>
        {!isCollapsed && currentTab.actions.length > 0 ? (
          <Flex sx={{ alignItems: "center" }}>
            {currentTab.actions.map((action) => (
              <Button
                key={action.id}
                variant="secondary"
                sx={{ p: 1, bg: "transparent" }}
                onClick={action.onClick}
                title={action.title}
                data-test-id={action.id}
              >
                <action.icon size={13} color="icon" />
              </Button>
            ))}
          </Flex>
        ) : null}
      </Flex>

      <Flex
        id="navigation-menu"
        data-test-id="navigation-menu"
        sx={{
          flex: 1,
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
        onContextMenu={async (e) => {
          e.preventDefault();
          Menu.openMenu(await getSidebarItemsAsMenuItems());
        }}
      >
        <Freeze freeze={isCollapsed || currentTab.id !== "notebooks"}>
          <Notebooks />
        </Freeze>
        <Freeze freeze={isCollapsed || currentTab.id !== "tags"}>
          <Tags />
        </Freeze>
        <Freeze freeze={currentTab.id !== "home" && !isCollapsed}>
          <FlexScrollContainer
            style={{
              flexDirection: "column",
              display: "flex"
            }}
            trackStyle={() => ({
              width: 3
            })}
            thumbStyle={() => ({ width: 3 })}
            suppressScrollX={true}
          >
            <Flex sx={{ flexDirection: "column", px: 1, gap: [1, 1, "small"] }}>
              <Routes
                isCollapsed={isCollapsed}
                collapse={() => isNavPaneCollapsed && setExpanded(false)}
              />
              <Colors
                isCollapsed={isCollapsed}
                collapse={() => isNavPaneCollapsed && setExpanded(false)}
              />
              <Box
                bg="separator"
                my={1}
                sx={{ width: "100%", height: "0.8px", alignSelf: "center" }}
              />
              <Shortcuts
                isCollapsed={isCollapsed}
                collapse={() => isNavPaneCollapsed && setExpanded(false)}
              />
            </Flex>
          </FlexScrollContainer>
        </Freeze>
      </Flex>
      {currentTab.id === "home" && !isCollapsed ? <Notice /> : null}
    </ScopedThemeProvider>
  );
}
export default React.memo(NavigationMenu);

function Routes({
  isCollapsed,
  collapse
}: {
  isCollapsed: boolean;
  collapse: () => void;
}) {
  const hiddenRoutes = useAppStore((store) => store.hiddenRoutes);
  return (
    <ReorderableList
      items={routes.filter((r) => !hiddenRoutes.includes(r.id))}
      orderKey={`sidebarOrder:routes`}
      order={() => db.settings.getSideBarOrder("routes")}
      onOrderChanged={(order) => db.settings.setSideBarOrder("routes", order)}
      context={{ isCollapsed, collapse }}
      renderItem={RouteItem}
    />
  );
}

function RouteItem({
  item,
  context
}: {
  item: Route;
  context?: { isCollapsed: boolean; collapse: () => void };
}) {
  const [location] = useLocation();

  return (
    <SortableNavigationItem
      key={item.id}
      id={item.id}
      title={item.title}
      icon={item.icon}
      isCollapsed={context?.isCollapsed}
      onDrop={async (e) => {
        await handleDrop(e.dataTransfer, {
          type:
            item.path === "/trash"
              ? "trash"
              : item.path === "/favorites"
              ? "favorites"
              : undefined
        });
      }}
      selected={
        item.path === "/"
          ? location === item.path
          : location.startsWith(item.path)
      }
      onClick={() => {
        if (navigateToRoute(item.path)) context?.collapse();
      }}
      menuItems={[
        {
          type: "lazy-loader",
          key: "sidebar-items-loader",
          items: getSidebarItemsAsMenuItems
        }
      ]}
    >
      <ItemCount item={item} />
    </SortableNavigationItem>
  );
}

function Colors({
  isCollapsed,
  collapse
}: {
  isCollapsed: boolean;
  collapse: () => void;
}) {
  const colors = useAppStore((store) => store.colors);
  const refreshNavItems = useAppStore((store) => store.refreshNavItems);
  const context = useNoteStore((store) =>
    store.context?.type === "color" ? store.context : null
  );
  const hiddenColors = useAppStore((store) => store.hiddenColors);

  return (
    <ReorderableList
      items={colors.filter((c) => !hiddenColors.includes(c.id))}
      orderKey={`sidebarOrder:colors`}
      order={() => db.settings.getSideBarOrder("colors")}
      onOrderChanged={(order) => db.settings.setSideBarOrder("colors", order)}
      renderItem={({ item: color }) => (
        <SortableNavigationItem
          id={color.id}
          key={color.id}
          title={color.title}
          isCollapsed={isCollapsed}
          icon={Circle}
          selected={context?.id === color.id}
          color={color.colorCode}
          onClick={() => {
            if (navigateToRoute(`/colors/${color.id}`)) collapse();
          }}
          onDrop={(e) => handleDrop(e.dataTransfer, color)}
          menuItems={[
            {
              type: "button",
              key: "rename-color",
              title: strings.renameColor(),
              onClick: () => RenameColorDialog.show(color),
              icon: Rename.path
            },
            {
              type: "button",
              key: "remove-color",
              title: strings.removeColor(),
              onClick: async () => {
                await db.colors.remove(color.id);
                await refreshNavItems();
              },
              icon: ColorRemove.path
            },
            {
              type: "separator",
              key: "sep"
            },
            {
              type: "lazy-loader",
              key: "sidebar-items-loader",
              items: getSidebarItemsAsMenuItems
            }
          ]}
        >
          <ItemCount item={color} />
        </SortableNavigationItem>
      )}
    />
  );
}

function Shortcuts({
  isCollapsed,
  collapse
}: {
  isCollapsed: boolean;
  collapse: () => void;
}) {
  const shortcuts = useAppStore((store) => store.shortcuts);
  const refreshNavItems = useAppStore((store) => store.refreshNavItems);
  const context = useNoteStore((store) =>
    store.context?.type === "tag" || store.context?.type === "notebook"
      ? store.context
      : null
  );

  return (
    <ReorderableList
      items={shortcuts}
      orderKey={`sidebarOrder:shortcuts`}
      order={() => db.settings.getSideBarOrder("shortcuts")}
      onOrderChanged={(order) =>
        db.settings.setSideBarOrder("shortcuts", order)
      }
      renderItem={({ item }) => (
        <SortableNavigationItem
          id={item.id}
          key={item.id}
          title={item.title}
          isCollapsed={isCollapsed}
          menuItems={[
            {
              type: "button",
              key: "removeshortcut",
              title: strings.doActions.remove.shortcut(1),
              onClick: async () => {
                await db.shortcuts.remove(item.id);
                refreshNavItems();
              }
            }
          ]}
          icon={
            item.type === "notebook"
              ? Notebook2
              : item.type === "tag"
              ? Tag2
              : Topic
          }
          selected={context?.id === item.id}
          onDrop={(e) => handleDrop(e.dataTransfer, item)}
          onClick={async () => {
            if (
              navigateToRoute(
                item.type === "notebook"
                  ? `/notebooks/${item.id}`
                  : `/tags/${item.id}`
              )
            )
              collapse();
          }}
        >
          <ItemCount item={item} />
        </SortableNavigationItem>
      )}
    />
  );
}

function ItemCount({ item }: { item: Route | Color | Notebook | Tag }) {
  const notes = useNoteStore((store) => store.notes?.length || 0);
  const reminders = useReminderStore((store) => store.reminders?.length || 0);
  const trash = useTrashStore((store) => store.trash?.length || 0);
  const monographs = useMonographStore(
    (store) => store.monographs?.length || 0
  );
  const count = usePromise(() => {
    if ("type" in item) {
      if (item.type === "color") return db.colors.count(item.id);
      else if (item.type === "notebook" || item.type === "tag")
        return db.relations.from(item, "note").count();
    } else {
      switch (item.id) {
        case "notes":
          return notes;
        case "favorites":
          return db.notes.favorites.count();
        case "reminders":
          return reminders;
        case "trash":
          return trash;
        case "monographs":
          return monographs;
        default:
          return 0;
      }
    }
  }, [notes, trash, monographs, reminders]);
  return (
    <Text variant="subBody">
      {count.status === "fulfilled" ? count.value : ""}
    </Text>
  );
}

function NavigationDropdown() {
  const user = useUserStore((store) => store.user);
  const profile = useSettingStore((store) => store.profile);
  const theme = useThemeStore((store) => store.colorScheme);
  const toggleNightMode = useThemeStore((store) => store.toggleColorScheme);
  const setFollowSystemTheme = useThemeStore(
    (store) => store.setFollowSystemTheme
  );

  const { isPro } = useMemo(() => {
    const type = user?.subscription?.type;
    const expiry = user?.subscription?.expiry;
    if (!expiry) return { isBasic: true, remainingDays: 0 };
    return {
      isTrial: type === SUBSCRIPTION_STATUS.TRIAL,
      isBasic: type === SUBSCRIPTION_STATUS.BASIC,
      isBeta: type === SUBSCRIPTION_STATUS.BETA,
      isPro: type === SUBSCRIPTION_STATUS.PREMIUM,
      isProCancelled: type === SUBSCRIPTION_STATUS.PREMIUM_CANCELED,
      isProExpired: type === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED
    };
  }, [user]);

  const notLoggedIn = Boolean(!user || !user.id);

  return (
    <Flex sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
      <Flex
        onClick={(e) => {
          e.preventDefault();
          Menu.openMenu(
            [
              {
                type: "popup",
                component: () => <UserProfile minimal />,
                key: "profile"
              },
              {
                type: "separator",
                key: "sep"
              },
              {
                type: "button",
                title: strings.toggleDarkLightMode(),
                key: "toggle-theme-mode",
                icon: theme === "dark" ? LightMode.path : DarkMode.path,
                onClick: () => {
                  setFollowSystemTheme(false);
                  toggleNightMode();
                }
              },
              {
                type: "button",
                title: strings.upgradeToPro(),
                icon: Pro.path,
                key: "upgrade",
                isHidden: notLoggedIn || isPro
              },
              {
                type: "button",
                title: settings.title,
                key: settings.id,
                icon: settings.icon.path,
                onClick: () => {
                  hashNavigate(settings.path);
                }
              },
              {
                type: "button",
                title: strings.helpAndSupport(),
                icon: Documentation.path,
                key: "help-and-support",
                onClick: () => {
                  window.open("https://help.notesnook.com/", "_blank");
                }
              },
              {
                type: "button",
                title: strings.login(),
                icon: Login.path,
                key: "login",
                isHidden: !notLoggedIn,
                onClick: () => hardNavigate("/login")
              },
              {
                type: "button",
                title: strings.logout(),
                icon: Logout.path,
                key: "logout",
                isHidden: notLoggedIn,
                onClick: () => logout()
              }
            ],
            {
              position: {
                target: e.currentTarget,
                location: "below",
                yOffset: 5
              }
            }
          );
        }}
        variant="columnCenter"
        data-test-id="profile-dropdown"
        sx={{
          bg: "background-secondary",
          size: 30,
          borderRadius: 80,
          cursor: "pointer",
          position: "relative",
          border: "1px solid var(--border)",
          alignItems: "center"
        }}
      >
        {!user || !user.id || !profile?.profilePicture ? (
          <User size={16} color="icon" />
        ) : (
          <Image
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: 80
            }}
            src={profile.profilePicture}
          />
        )}
      </Flex>
    </Flex>
  );
}

type ReorderableListProps<T> = {
  orderKey: string;
  items: T[];
  context?: any;
  renderItem: (props: { item: T; context?: any }) => JSX.Element;
  onOrderChanged: (newOrder: string[]) => void;
  order: () => string[];
};

function ReorderableList<T extends { id: string }>(
  props: ReorderableListProps<T>
) {
  const {
    orderKey,
    items,
    renderItem: Item,
    onOrderChanged,
    context,
    order: _order
  } = props;
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const [activeItem, setActiveItem] = useState<T>();
  const [order, setOrder] = usePersistentState<string[]>(orderKey, _order());
  const orderedItems = orderItems(items, order);

  useEffect(() => {
    setOrder(_order());
  }, [_order]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      cancelDrop={() => {
        // if (!isUserPremium()) {
        //   showToast("error", "You need to be Pro to customize the sidebar.");
        //   return true;
        // }
        return false;
      }}
      onDragStart={(event) => {
        setActiveItem(orderedItems.find((i) => i.id === event.active.id));
      }}
      onDragEnd={(event) => {
        const { active, over } = event;

        const overId = over?.id as string;
        if (overId && active.id !== overId) {
          const transitionOrder =
            order.length === 0 || order.length !== orderedItems.length
              ? orderedItems.map((i) => i.id)
              : order;
          const newIndex = transitionOrder.indexOf(overId);
          const oldIndex = transitionOrder.indexOf(active.id as string);
          const newOrder = arrayMove(transitionOrder, oldIndex, newIndex);
          setOrder(newOrder);
          onOrderChanged(newOrder);
        }
        setActiveItem(undefined);
      }}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always }
      }}
    >
      <SortableContext
        items={orderedItems}
        strategy={verticalListSortingStrategy}
      >
        {orderedItems.map((item) => (
          <Item key={item.id} item={item} context={context} />
        ))}

        <DragOverlay
          dropAnimation={{
            duration: 500,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)"
          }}
        >
          {activeItem && <Item item={activeItem} context={context} />}
        </DragOverlay>
      </SortableContext>
    </DndContext>
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
  extraProps?: (item: T) => Partial<MenuItem>
): MenuItem[] {
  return items.map((item) => ({
    ...extraProps?.(item),
    type: "button",
    key: item.id,
    title: item.title,
    isChecked: !hiddenIds.includes(item.id),
    onClick: async () => {
      const copy = hiddenIds.slice();
      const index = copy.indexOf(item.id);
      if (index > -1) copy.splice(index, 1);
      else copy.push(item.id);
      onHiddenIdsUpdated(copy);
    }
  }));
}

async function getSidebarItemsAsMenuItems(): Promise<MenuItem[]> {
  const colors = useAppStore.getState().colors;
  const hiddenColors = useAppStore.getState().hiddenColors;
  const hiddenRoutes = useAppStore.getState().hiddenRoutes;
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
      icon: Reset.path
    },
    { type: "separator", key: "sep" },
    ...toMenuItems(
      orderItems(routes, db.settings.getSideBarOrder("routes")),
      hiddenRoutes,
      (ids) =>
        db.settings
          .setSideBarHiddenItems("routes", ids)
          .then(() => useAppStore.getState().setHiddenRoutes(ids)),
      (item) => ({ icon: item.icon.path })
    ),
    { type: "separator", key: "sep", isHidden: colors.length <= 0 },
    ...toMenuItems(
      orderItems(colors, db.settings.getSideBarOrder("colors")),
      hiddenColors,
      (ids) =>
        db.settings
          .setSideBarHiddenItems("colors", ids)
          .then(() => useAppStore.getState().setHiddenColors(ids)),
      (item) => ({
        icon: Circle.path,
        styles: { icon: { color: item.colorCode } }
      })
    )
  ] as MenuItem[];
}

function navigateToRoute(path: string) {
  if (!isMobile() && getCurrentPath() === path) {
    if (useSearchStore.getState().isSearching)
      return useSearchStore.getState().resetSearch();
    return useAppStore.getState().toggleListPane();
  }
  navigate(path);
  return true;
}
