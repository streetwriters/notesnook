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
import { Box, Button, Flex } from "@theme-ui/components";
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
  User
} from "../icons";
import NavigationItem, { SortableNavigationItem } from "./navigation-item";
import { hardNavigate, hashNavigate, navigate } from "../../navigation";
import { db } from "../../common/db";
import useMobile from "../../hooks/use-mobile";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useStore as useSettingStore } from "../../stores/setting-store";
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
import { Notebook, Tag } from "@notesnook/core";
import { handleDrop } from "../../common/drop-handler";
import { Menu } from "../../hooks/use-menu";
import { RenameColorDialog } from "../../dialogs/item-dialog";
import { strings } from "@notesnook/intl";

type Route = {
  id: string;
  title: string;
  path: string;
  icon: Icon;
  tag?: string;
};

const navigationHistory = new Map();
function shouldSelectNavItem(route: string, pin: Notebook | Tag) {
  return route.endsWith(pin.id);
}

const routes: Route[] = [
  { id: "notes", title: strings.routes.Notes(), path: "/notes", icon: Note },
  {
    id: "notebooks",
    title: strings.routes.Notebooks(),
    path: "/notebooks",
    icon: NotebookIcon
  },
  {
    id: "favorites",
    title: strings.routes.Favorites(),
    path: "/favorites",
    icon: StarOutline
  },
  { id: "tags", title: strings.routes.Tags(), path: "/tags", icon: TagIcon },
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

const settings: Route = {
  id: "settings",
  title: strings.routes.Settings(),
  path: "/settings",
  icon: Settings
};

type NavigationMenuProps = {
  toggleNavigationContainer: (toggleState?: boolean) => void;
  isTablet: boolean;
};

function NavigationMenu(props: NavigationMenuProps) {
  const { toggleNavigationContainer, isTablet } = props;
  const [location, previousLocation, state] = useLocation();
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const colors = useAppStore((store) => store.colors);
  const shortcuts = useAppStore((store) => store.shortcuts);
  const refreshNavItems = useAppStore((store) => store.refreshNavItems);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const profile = useSettingStore((store) => store.profile);
  const isMobile = useMobile();
  const theme = useThemeStore((store) => store.colorScheme);
  const toggleNightMode = useThemeStore((store) => store.toggleColorScheme);
  const setFollowSystemTheme = useThemeStore(
    (store) => store.setFollowSystemTheme
  );
  const [hiddenRoutes, setHiddenRoutes] = usePersistentState(
    "sidebarHiddenItems:routes",
    db.settings.getSideBarHiddenItems("routes")
  );
  const [hiddenColors, setHiddenColors] = usePersistentState(
    "sidebarHiddenItems:colors",
    db.settings.getSideBarHiddenItems("colors")
  );
  const dragTimeout = useRef(0);

  const _navigate = useCallback(
    (path: string) => {
      toggleNavigationContainer(true);
      const nestedRoute = findNestedRoute(path);
      navigate(!nestedRoute || nestedRoute === location ? path : nestedRoute);
    },
    [location, toggleNavigationContainer]
  );

  useEffect(() => {
    if (state === "forward" || state === "neutral")
      navigationHistory.set(location, true);
    else if (state === "same" && location !== previousLocation) {
      navigationHistory.delete(previousLocation);
      navigationHistory.set(location, true);
    } else navigationHistory.delete(previousLocation);
  }, [location, previousLocation, state]);

  const getSidebarItems = useCallback(async () => {
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
              setHiddenRoutes([]);
              setHiddenColors([]);
            });
        }
      },
      { type: "separator", key: "sep" },
      ...toMenuItems(
        orderItems(routes, db.settings.getSideBarOrder("routes")),
        hiddenRoutes,
        (ids) =>
          db.settings
            .setSideBarHiddenItems("routes", ids)
            .then(() => setHiddenRoutes(ids))
      ),
      { type: "separator", key: "sep", isHidden: colors.length <= 0 },
      ...toMenuItems(
        orderItems(colors, db.settings.getSideBarOrder("colors")),
        hiddenColors,
        (ids) =>
          db.settings
            .setSideBarHiddenItems("colors", ids)
            .then(() => setHiddenColors(ids))
      )
    ] as MenuItem[];
  }, [colors, hiddenColors, hiddenRoutes]);

  return (
    <ScopedThemeProvider
      scope="navigationMenu"
      sx={{
        display: "flex",
        zIndex: 1,
        position: "relative",
        flex: 1,
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bg: "background",
        borderRight: "1px solid var(--separator)"
      }}
    >
      <Flex
        id="navigation-menu"
        data-test-id="navigation-menu"
        sx={{
          display: isFocusMode ? "none" : "flex",
          flex: 1,
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
        px={0}
        onContextMenu={async (e) => {
          e.preventDefault();
          Menu.openMenu(await getSidebarItems());
        }}
      >
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
          <Flex sx={{ flexDirection: "column" }}>
            <ReorderableList
              items={routes.filter((r) => !hiddenRoutes.includes(r.id))}
              orderKey={`sidebarOrder:routes`}
              order={() => db.settings.getSideBarOrder("routes")}
              onOrderChanged={(order) =>
                db.settings.setSideBarOrder("routes", order)
              }
              renderOverlay={({ item }) => (
                <NavigationItem
                  id={item.id}
                  isTablet={isTablet}
                  title={item.title}
                  icon={item.icon}
                  tag={item.tag}
                  selected={
                    item.path === "/"
                      ? location === item.path
                      : location.startsWith(item.path)
                  }
                />
              )}
              renderItem={({ item }) => (
                <SortableNavigationItem
                  key={item.id}
                  id={item.id}
                  isTablet={isTablet}
                  title={item.title}
                  icon={item.icon}
                  tag={item.tag}
                  onDragEnter={() => {
                    if (["/notebooks", "/tags"].includes(item.path))
                      dragTimeout.current = setTimeout(
                        () => _navigate(item.path),
                        1000
                      ) as unknown as number;
                  }}
                  onDragLeave={() => clearTimeout(dragTimeout.current)}
                  onDrop={async (e) => {
                    clearTimeout(dragTimeout.current);

                    await handleDrop(e.dataTransfer, {
                      type:
                        item.path === "/trash"
                          ? "trash"
                          : item.path === "/favorites"
                          ? "favorites"
                          : item.path === "/notebooks"
                          ? "notebooks"
                          : undefined
                    });
                  }}
                  selected={
                    item.path === "/"
                      ? location === item.path
                      : location.startsWith(item.path)
                  }
                  onClick={() => {
                    if (!isMobile && location === item.path)
                      return toggleNavigationContainer();
                    _navigate(item.path);
                  }}
                  menuItems={[
                    {
                      type: "lazy-loader",
                      key: "sidebar-items-loader",
                      items: getSidebarItems
                    }
                  ]}
                />
              )}
            />

            <ReorderableList
              items={colors.filter((c) => !hiddenColors.includes(c.id))}
              orderKey={`sidebarOrder:colors`}
              order={() => db.settings.getSideBarOrder("colors")}
              onOrderChanged={(order) =>
                db.settings.setSideBarOrder("colors", order)
              }
              renderOverlay={({ item }) => (
                <NavigationItem
                  id={item.id}
                  isTablet={isTablet}
                  title={item.title}
                  icon={Circle}
                  color={item.colorCode}
                  selected={location === `/colors/${item.id}`}
                />
              )}
              renderItem={({ item: color }) => (
                <SortableNavigationItem
                  id={color.id}
                  isTablet={isTablet}
                  key={color.id}
                  title={color.title}
                  icon={Circle}
                  selected={location === `/colors/${color.id}`}
                  color={color.colorCode}
                  onClick={() => {
                    _navigate(`/colors/${color.id}`);
                  }}
                  onDrop={(e) => handleDrop(e.dataTransfer, color)}
                  menuItems={[
                    {
                      type: "button",
                      key: "rename-color",
                      title: strings.renameColor(),
                      onClick: () => RenameColorDialog.show(color)
                    },
                    {
                      type: "button",
                      key: "remove-color",
                      title: strings.removeColor(),
                      onClick: async () => {
                        await db.colors.remove(color.id);
                        await refreshNavItems();
                      }
                    },
                    {
                      type: "separator",
                      key: "sep"
                    },
                    {
                      type: "lazy-loader",
                      key: "sidebar-items-loader",
                      items: getSidebarItems
                    }
                  ]}
                />
              )}
            />
            <Box
              bg="separator"
              my={1}
              sx={{ width: "85%", height: "0.8px", alignSelf: "center" }}
            />
            <ReorderableList
              items={shortcuts}
              orderKey={`sidebarOrder:shortcuts`}
              order={() => db.settings.getSideBarOrder("shortcuts")}
              onOrderChanged={(order) =>
                db.settings.setSideBarOrder("shortcuts", order)
              }
              renderOverlay={({ item }) => (
                <NavigationItem
                  id={item.id}
                  isTablet={isTablet}
                  key={item.id}
                  title={item.title}
                  icon={
                    item.type === "notebook"
                      ? Notebook2
                      : item.type === "tag"
                      ? Tag2
                      : Topic
                  }
                  isShortcut
                  selected={shouldSelectNavItem(location, item)}
                />
              )}
              renderItem={({ item }) => (
                <SortableNavigationItem
                  id={item.id}
                  isTablet={isTablet}
                  key={item.id}
                  title={item.title}
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
                  isShortcut
                  selected={shouldSelectNavItem(location, item)}
                  onDrop={(e) => handleDrop(e.dataTransfer, item)}
                  onClick={async () => {
                    if (item.type === "notebook") {
                      const root = (await db.notebooks.breadcrumbs(item.id)).at(
                        0
                      );
                      if (root && root.id !== item.id)
                        _navigate(`/notebooks/${root.id}/${item.id}`);
                      else _navigate(`/notebooks/${item.id}`);
                    } else if (item.type === "tag") {
                      _navigate(`/tags/${item.id}`);
                    }
                  }}
                />
              )}
            />
          </Flex>
        </FlexScrollContainer>

        <Flex sx={{ flexDirection: "column" }}>
          {isLoggedIn === false && (
            <NavigationItem
              id="login"
              isTablet={isTablet}
              title={strings.login()}
              icon={Login}
              onClick={() => hardNavigate("/login")}
            />
          )}
          {isTablet && (
            <NavigationItem
              id="change-theme"
              isTablet={isTablet}
              title={theme === "dark" ? strings.light() : strings.dark()}
              icon={theme === "dark" ? LightMode : DarkMode}
              onClick={() => {
                setFollowSystemTheme(false);
                toggleNightMode();
              }}
            />
          )}
          <NavigationItem
            id={settings.id}
            isTablet={isTablet}
            key={settings.path}
            title={profile?.fullName || settings.title}
            icon={profile?.fullName ? User : settings.icon}
            image={profile?.fullName ? profile?.profilePicture : undefined}
            onClick={() => {
              if (!isMobile && location === settings.path)
                return toggleNavigationContainer();
              hashNavigate("/settings");
            }}
            selected={location.startsWith(settings.path)}
          >
            {isTablet ? null : (
              <Button
                variant={"icon"}
                title={strings.toggleDarkLightMode()}
                sx={{ borderLeft: "1px solid var(--separator)" }}
                onClick={() => {
                  setFollowSystemTheme(false);
                  toggleNightMode();
                }}
              >
                {theme === "dark" ? (
                  <LightMode size={16} />
                ) : (
                  <DarkMode size={16} />
                )}
              </Button>
            )}
          </NavigationItem>
        </Flex>
      </Flex>
    </ScopedThemeProvider>
  );
}
export default NavigationMenu;

function findNestedRoute(location: string) {
  let level = location.split("/").length;
  let nestedRoute = undefined;
  const history = Array.from(navigationHistory.keys());
  for (let i = history.length - 1; i >= 0; --i) {
    const route = history[i];
    if (!navigationHistory.get(route)) continue;

    const routeLevel = route.split("/").length;
    if (route.startsWith(location) && routeLevel > level) {
      level = routeLevel;
      nestedRoute = route;
    }
  }
  return nestedRoute;
}

type ReorderableListProps<T> = {
  orderKey: string;
  items: T[];
  renderItem: (props: { item: T }) => JSX.Element;
  renderOverlay: (props: { item: T }) => JSX.Element;
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
    renderOverlay: Overlay,
    onOrderChanged,
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
          <Item key={item.id} item={item} />
        ))}

        <DragOverlay
          dropAnimation={{
            duration: 500,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)"
          }}
        >
          {activeItem && <Overlay item={activeItem} />}
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
  onHiddenIdsUpdated: (ids: string[]) => void
): MenuItem[] {
  return items.map((item) => ({
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
