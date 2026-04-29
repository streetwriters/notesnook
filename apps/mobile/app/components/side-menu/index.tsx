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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { useGroupOptions } from "../../hooks/use-group-options";
import { presentSheet, ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useTagStore } from "../../stores/use-tag-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { deleteItems } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { presentDialog } from "../dialog/functions";
import { AddNotebookSheet } from "../sheets/add-notebook";
import Sort from "../sheets/sort";

import { SideMenuHome } from "./side-menu-home";
import { SideMenuNotebooks } from "./side-menu-notebooks";
import { SideMenuTags } from "./side-menu-tags";
import {
  useSideMenuNotebookSelectionStore,
  useSideMenuTagsSelectionStore
} from "./stores";
import { TabBarButton } from "./tab-bar-button";
import { useSideBarDraggingStore } from "./dragging-store";
import { Button } from "../ui/button";
import SettingsService from "../../services/settings";
import { isFeatureAvailable } from "@notesnook/common";
import PaywallSheet from "../sheets/paywall";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { Spacing } from "../../common/design/spacing";

/**
 * Simple Tab View Implementation for the Side bar
 */
type SimpleRoute = {
  key: string;
  title?: string;
};

type SimpleNavigationState = {
  index: number;
  routes: SimpleRoute[];
};

type SimpleTabBarProps = {
  navigationState: SimpleNavigationState;
  jumpTo: (key: string) => void;
};

type SimpleTabViewProps = {
  navigationState: SimpleNavigationState;
  renderScene: ({ route }: { route: SimpleRoute }) => React.ReactNode;
  renderTabBar?: (props: SimpleTabBarProps) => React.ReactNode;
  onIndexChange?: (index: number) => void;
};

const createSceneMap = (
  scenes: Record<string, React.ComponentType<unknown>>
): ((props: { route: SimpleRoute }) => React.ReactNode) => {
  // eslint-disable-next-line react/display-name
  return ({ route }: { route: SimpleRoute }) => {
    const SceneComponent = scenes[route.key];
    if (!SceneComponent) return null;
    return <SceneComponent />;
  };
};

const SimpleTabView = ({
  navigationState,
  renderScene,
  renderTabBar,
  onIndexChange
}: SimpleTabViewProps) => {
  const loadedKeysRef = React.useRef(new Set<string>());
  const scenesRef = React.useRef(new Map<string, React.ReactNode>());
  const jumpTo = React.useCallback(
    (key: string) => {
      const nextIndex = navigationState.routes.findIndex(
        (route) => route.key === key
      );
      if (nextIndex !== -1 && nextIndex !== navigationState.index) {
        onIndexChange?.(nextIndex);
      }
    },
    [navigationState.index, navigationState.routes, onIndexChange]
  );

  const activeKey = navigationState.routes[navigationState.index]?.key;
  if (activeKey && !loadedKeysRef.current.has(activeKey)) {
    loadedKeysRef.current.add(activeKey);
  }

  const getSceneForRoute = React.useCallback(
    (route: SimpleRoute) => {
      const cached = scenesRef.current.get(route.key);
      if (cached) return cached;
      const created = renderScene({ route });
      scenesRef.current.set(route.key, created);
      return created;
    },
    [renderScene]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {navigationState.routes.map((route, routeIndex) => (
          <View
            key={route.key}
            style={{
              flex: 1,
              display: navigationState.index === routeIndex ? "flex" : "none"
            }}
          >
            {loadedKeysRef.current.has(route.key)
              ? getSceneForRoute(route)
              : navigationState.index === routeIndex
                ? getSceneForRoute(route)
                : null}
          </View>
        ))}
      </View>

      {renderTabBar ? renderTabBar({ navigationState, jumpTo }) : null}
    </View>
  );
};

const renderScene = createSceneMap({
  home: SideMenuHome,
  notebooks: SideMenuNotebooks,
  tags: SideMenuTags,
  settings: () => null
});

export const SideMenu = React.memo(
  function SideMenu() {
    const { colors } = useThemeColors();
    const insets = useGlobalSafeAreaInsets();
    const [index, setIndex] = React.useState(
      SettingsService.getProperty("defaultSidebarTab")
    );
    const [routes] = React.useState<SimpleRoute[]>([
      {
        key: "home",
        title: "Home"
      },
      {
        key: "notebooks",
        title: "Notebooks"
      },
      {
        key: "tags",
        title: "Tags"
      }
    ]);

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.primary.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left
        }}
      >
        <SimpleTabView
          navigationState={{ index, routes }}
          renderTabBar={(props) => <TabBar {...props} />}
          renderScene={renderScene}
          onIndexChange={setIndex}
        />
      </View>
    );
  },
  () => true
);

const TabBar = (props: SimpleTabBarProps) => {
  const dragging = useSideBarDraggingStore((state) => state.dragging);
  const { colors, isDark } = useThemeColors();
  const groupOptions = useGroupOptions(
    props.navigationState.index === 1 ? "notebooks" : "tags"
  );
  const notebookSelectionEnabled = useSideMenuNotebookSelectionStore(
    (state) => state.enabled
  );
  const tagSelectionEnabled = useSideMenuTagsSelectionStore(
    (state) => state.enabled
  );
  const isSelectionEnabled = notebookSelectionEnabled || tagSelectionEnabled;

  const getIcon = (key: string) => {
    switch (key) {
      case "home":
        return "home";
      case "notebooks":
        return "bookmark";
      case "tags":
        return "shopping-mode";
      default:
        return "home";
    }
  };

  return (
    <View
      style={{
        width: "100%",
        paddingHorizontal: Spacing.LEVEL_3
      }}
    >
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
          backgroundColor: colors.primary.background,
          borderTopWidth: 1,
          borderTopColor: colors.primary.border,
          paddingTop: Spacing.LEVEL_2
        }}
      >
        {isSelectionEnabled ? (
          <>
            {[
              {
                title: "Select all",
                icon: "checks"
              },
              {
                title: "Delete",
                icon: "trash"
              },
              {
                title: "Move",
                icon: "drive-file-move",
                hidden:
                  !notebookSelectionEnabled || props.navigationState.index !== 1
              },
              {
                title: "Close",
                icon: "close"
              }
            ].map((item) =>
              item.hidden ? null : (
                <TabBarButton
                  key={item.title}
                  icon={item.icon}
                  label={item.title}
                  onPress={async () => {
                    switch (item.title) {
                      case "Select all": {
                        if (notebookSelectionEnabled) {
                          useSideMenuNotebookSelectionStore
                            .getState()
                            .selectAll?.();
                        } else {
                          useSideMenuTagsSelectionStore
                            .getState()
                            .selectAll?.();
                        }

                        break;
                      }
                      case "Delete": {
                        if (notebookSelectionEnabled) {
                          const ids = useSideMenuNotebookSelectionStore
                            .getState()
                            .getSelectedItemIds();
                          deleteItems("notebook", ids);
                        } else {
                          const ids = useSideMenuTagsSelectionStore
                            .getState()
                            .getSelectedItemIds();
                          await deleteItems("tag", ids);
                        }
                        break;
                      }
                      case "Move": {
                        const ids = useSideMenuNotebookSelectionStore
                          .getState()
                          .getSelectedItemIds();
                        if (!ids.length) {
                          ToastManager.show({
                            context: "local",
                            type: "error",
                            message: strings.noNotebooksSelectedToMove()
                          });
                          return;
                        }
                        const notebooks = await db.notebooks.all.items(ids);
                        Navigation.navigate("MoveNotebook", {
                          selectedNotebooks: notebooks
                        });
                        break;
                      }
                      case "Close": {
                        useSideMenuNotebookSelectionStore.setState({
                          enabled: false,
                          selection: {}
                        });
                        useSideMenuTagsSelectionStore.setState({
                          enabled: false,
                          selection: {}
                        });
                        break;
                      }
                    }
                  }}
                />
              )
            )}
          </>
        ) : (
          <>
            {dragging ? (
              <Button
                onPress={() => {
                  useSideBarDraggingStore.setState({
                    dragging: false
                  });
                }}
                style={{
                  width: "100%"
                }}
                type="accent"
                testID="check"
                title={strings.done()}
                icon={"check"}
                iconSize={AppFontSize.lg - 2}
              />
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    gap: Spacing.LEVEL_2
                  }}
                >
                  {props.navigationState.routes.map((route, index) => {
                    const isFocused = props.navigationState.index === index;

                    return (
                      <TabBarButton
                        key={route.key}
                        testID={`tab-${route.key}`}
                        icon={getIcon(route.key)}
                        label={route.title || ""}
                        isActive={isFocused}
                        onPress={() => {
                          props.jumpTo(route.key);
                          switch (route.key) {
                            case "notebooks":
                              Navigation.routeNeedsUpdate(
                                "Notebooks",
                                Navigation.routeUpdateFunctions.Notebooks
                              );
                              break;
                            case "tags":
                              Navigation.routeNeedsUpdate(
                                "Tags",
                                Navigation.routeUpdateFunctions.Tags
                              );
                              break;
                            default:
                              break;
                          }
                        }}
                      />
                    );
                  })}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DefaultAppStyles.GAP_SMALL
                  }}
                >
                  {props.navigationState.index > 0 ? (
                    <>
                      <TabBarButton
                        icon="plus"
                        testID="sidebar-add-button"
                        label={
                          props.navigationState.index === 1 ? "Notebook" : "Tag"
                        }
                        onPress={async () => {
                          if (props.navigationState.index === 1) {
                            const notebooksFeature =
                              await isFeatureAvailable("notebooks");
                            if (!notebooksFeature.isAllowed) {
                              PaywallSheet.present(notebooksFeature);
                              return;
                            }

                            AddNotebookSheet.present();
                          } else {
                            const tagsFeature =
                              await isFeatureAvailable("tags");
                            if (!tagsFeature.isAllowed) {
                              PaywallSheet.present(tagsFeature);
                              return;
                            }
                            presentDialog({
                              title: strings.addTag(),
                              inputLabel: "Enter title",
                              inputPlaceholder: "eg. journal",
                              input: true,
                              positiveText: "Add",
                              positivePress: async (tag) => {
                                if (tag) {
                                  await db.tags.add({
                                    title: tag
                                  });
                                  useTagStore.getState().refresh();
                                  return true;
                                }
                                ToastManager.show({
                                  context: "local",
                                  type: "error",
                                  message: strings.allFieldsRequired()
                                });
                                return false;
                              }
                            });
                          }
                        }}
                      />

                      <TabBarButton
                        icon={
                          groupOptions?.sortDirection === "asc"
                            ? "sort-ascending"
                            : "sort-descending"
                        }
                        testID="sidebar-sort-button"
                        label="Sort"
                        onPress={() => {
                          presentSheet({
                            component: (
                              <Sort
                                type={
                                  props.navigationState.index === 1
                                    ? "notebook"
                                    : "tag"
                                }
                                group={
                                  props.navigationState.index === 1
                                    ? "notebooks"
                                    : "tags"
                                }
                                hideGroupOptions
                              />
                            )
                          });
                        }}
                      />
                    </>
                  ) : null}

                  {props.navigationState.index === 0 ? (
                    <>
                      <TabBarButton
                        icon={isDark ? "dark-mode-outline" : "sun"}
                        testID="sidebar-theme-button"
                        label={isDark ? "Dark" : "Light"}
                        onPress={() => {
                          useThemeStore.getState().setColorScheme();
                        }}
                      />
                    </>
                  ) : null}
                </View>
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default SideMenu;
