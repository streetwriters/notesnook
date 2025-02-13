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

import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  NavigationState,
  Route,
  SceneMap,
  SceneRendererProps,
  TabDescriptor,
  TabView
} from "react-native-tab-view";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { useGroupOptions } from "../../hooks/use-group-options";
import { presentSheet, ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useThemeStore } from "../../stores/use-theme-store";
import { deleteItems } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { AddNotebookSheet } from "../sheets/add-notebook";
import { MoveNotebookSheet } from "../sheets/move-notebook";
import Sort from "../sheets/sort";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import { SideMenuHome } from "./side-menu-home";
import { SideMenuNotebooks } from "./side-menu-notebooks";
import { SideMenuTags } from "./side-menu-tags";
import {
  useSideMenuNotebookSelectionStore,
  useSideMenuTagsSelectionStore
} from "./stores";
import { presentDialog } from "../dialog/functions";
import { strings } from "@notesnook/intl";
import { useTagStore } from "../../stores/use-tag-store";
const renderScene = SceneMap({
  home: SideMenuHome,
  notebooks: SideMenuNotebooks,
  tags: SideMenuTags,
  settings: () => null
});

export const SideMenu = React.memo(
  function SideMenu() {
    const { colors } = useThemeColors();
    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState<Route[]>([
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
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.primary.background
        }}
      >
        <TabView
          navigationState={{ index, routes }}
          renderTabBar={(props) => <TabBar {...props} />}
          tabBarPosition="bottom"
          renderScene={renderScene}
          onIndexChange={setIndex}
          swipeEnabled={false}
          animationEnabled={false}
          lazy={true}
        />
      </SafeAreaView>
    );
  },
  () => true
);

const TabBar = (
  props: SceneRendererProps & {
    navigationState: NavigationState<Route>;
    options: Record<string, TabDescriptor<Route>> | undefined;
  }
) => {
  const { colors, isDark } = useThemeColors();
  const groupOptions = useGroupOptions(
    props.navigationState.index === 1 ? "notebook" : "tags"
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
        return "home-outline";
      case "notebooks":
        return "book-outline";
      case "tags":
        return "pound";
      default:
        return "home-outline";
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: colors.primary.background,
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingVertical: DefaultAppStyles.GAP_SMALL,
        borderTopWidth: 1,
        borderTopColor: colors.primary.border
      }}
    >
      {isSelectionEnabled ? (
        <>
          {[
            {
              title: "Select all",
              icon: "check-all"
            },
            {
              title: "Delete",
              icon: "delete"
            },
            {
              title: "Move",
              icon: "arrow-right-bold-box-outline",
              hidden: !notebookSelectionEnabled
            },
            {
              title: "Close",
              icon: "close"
            }
          ].map((item) => (
            <>
              <Pressable
                key={item.title}
                onPress={async () => {
                  switch (item.title) {
                    case "Select all": {
                      if (notebookSelectionEnabled) {
                        useSideMenuNotebookSelectionStore
                          .getState()
                          .selectAll?.();
                      } else {
                        useSideMenuTagsSelectionStore.getState().selectAll?.();
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
                        deleteItems("tag", ids);
                      }
                      break;
                    }
                    case "Move": {
                      const ids = useSideMenuNotebookSelectionStore
                        .getState()
                        .getSelectedItemIds();
                      const notebooks = await db.notebooks.all.items(ids);
                      MoveNotebookSheet.present(notebooks);
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
                style={{
                  borderRadius: 10,
                  paddingVertical: 2,
                  width: "25%"
                }}
                type="plain"
              >
                <Icon
                  name={item.icon}
                  color={colors.primary.icon}
                  size={AppFontSize.lg}
                />
                <Paragraph
                  color={colors.secondary.paragraph}
                  size={AppFontSize.xxxs - 1}
                >
                  {item.title}
                </Paragraph>
              </Pressable>
            </>
          ))}
        </>
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              gap: DefaultAppStyles.GAP_SMALL
            }}
          >
            {props.navigationState.routes.map((route, index) => {
              const isFocused = props.navigationState.index === index;

              return (
                <Pressable
                  key={route.key}
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
                  style={{
                    borderRadius: 10,
                    opacity: isFocused ? 1 : 0.6,
                    paddingVertical: 2,
                    width: 40,
                    height: 40
                  }}
                  type={isFocused ? "selected" : "plain"}
                >
                  <Icon
                    name={getIcon(route.key)}
                    color={
                      isFocused ? colors.primary.accent : colors.primary.icon
                    }
                    size={AppFontSize.lg}
                  />
                </Pressable>
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
                <IconButton
                  name="plus"
                  size={AppFontSize.lg - 2}
                  onPress={() => {
                    if (props.navigationState.index === 1) {
                      AddNotebookSheet.present();
                    } else {
                      presentDialog({
                        title: strings.addTag(),
                        paragraph: strings.addTagDesc(),
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
                  style={{
                    width: 35,
                    height: 35
                  }}
                />

                <IconButton
                  name={
                    groupOptions.sortDirection === "asc"
                      ? "sort-ascending"
                      : "sort-descending"
                  }
                  color={colors.secondary.icon}
                  onPress={() => {
                    presentSheet({
                      component: (
                        <Sort
                          type={
                            props.navigationState.index === 1
                              ? "notebook"
                              : "tag"
                          }
                          hideGroupOptions
                        />
                      )
                    });
                  }}
                  style={{
                    width: 35,
                    height: 35
                  }}
                  size={AppFontSize.lg - 2}
                />

                {/* <IconButton
                  name="magnify"
                  color={colors.secondary.icon}
                  onPress={() => {}}
                  style={{
                    width: 35,
                    height: 35
                  }}
                  size={SIZE.lg - 2}
                /> */}
              </>
            ) : null}

            {props.navigationState.index === 0 ? (
              <IconButton
                onPress={() => {
                  useThemeStore.getState().setColorScheme();
                }}
                style={{
                  width: 28,
                  height: 28
                }}
                color={colors.primary.icon}
                name={isDark ? "weather-night" : "weather-sunny"}
                size={AppFontSize.lg - 2}
              />
            ) : null}
          </View>
        </>
      )}
    </View>
  );
};
