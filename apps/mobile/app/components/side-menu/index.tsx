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
import { Image, View } from "react-native";
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
import Navigation from "../../services/navigation";
import { useUserStore } from "../../stores/use-user-store";
import { deleteItems } from "../../utils/functions";
import { SIZE } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { MoveNotebookSheet } from "../sheets/move-notebook";
import { UserSheet } from "../sheets/user";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import { SideMenuHome } from "./side-menu-home";
import { SideMenuNotebooks } from "./side-menu-notebooks";
import { SideMenuTags } from "./side-menu-tags";
import {
  useSideMenuNotebookSelectionStore,
  useSideMenuTagsSelectionStore
} from "./stores";
import { SafeAreaView } from "react-native-safe-area-context";
import { rootNavigatorRef } from "../../utils/global-refs";
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
      },
      {
        key: "settings",
        title: "Settings"
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
        />
      </SafeAreaView>
    );
  },
  () => true
);

const SettingsIcon = (props: {
  route: Route;
  isFocused: boolean;
  jumpTo: (routeName: string) => void;
}) => {
  const { colors } = useThemeColors();
  const userProfile = useUserStore((state) => state.profile);
  const user = useUserStore((state) => state.user);

  return (
    <Pressable
      key={props.route.key}
      onPress={() => {
        rootNavigatorRef.navigate("Settings");
        // if (!user) {
        //   rootNavigatorRef.navigate("Settings");
        //   return;
        // }
        // UserSheet.present();
      }}
      style={{
        borderRadius: 10,
        paddingVertical: 2,
        width: "25%"
      }}
      type={props.isFocused ? "selected" : "plain"}
    >
      {userProfile?.profilePicture ? (
        <Image
          source={{
            uri: userProfile?.profilePicture
          }}
          style={{
            width: SIZE.lg,
            height: SIZE.lg,
            borderRadius: 100
          }}
        />
      ) : (
        <Icon
          name="cog-outline"
          color={props.isFocused ? colors.primary.accent : colors.primary.icon}
          size={SIZE.lg}
        />
      )}

      <Paragraph
        color={
          props.isFocused
            ? colors.primary.paragraph
            : colors.secondary.paragraph
        }
        style={{
          opacity: props.isFocused ? 1 : 0.6
        }}
        size={SIZE.xxxs - 1}
      >
        {userProfile?.fullName
          ? userProfile.fullName.split(" ")[0]
          : props.route.title}
      </Paragraph>
    </Pressable>
  );
};

const TabBar = (
  props: SceneRendererProps & {
    navigationState: NavigationState<Route>;
    options: Record<string, TabDescriptor<Route>> | undefined;
  }
) => {
  const { colors } = useThemeColors();
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
      case "settings":
        return "cog-outline";
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
        paddingVertical: DefaultAppStyles.GAP_SMALL
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
                        deleteItems(ids, "notebook");
                      } else {
                        const ids = useSideMenuTagsSelectionStore
                          .getState()
                          .getSelectedItemIds();
                        deleteItems(ids, "tag");
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
                  size={SIZE.lg}
                />
                <Paragraph
                  color={colors.secondary.paragraph}
                  size={SIZE.xxxs - 1}
                >
                  {item.title}
                </Paragraph>
              </Pressable>
            </>
          ))}
        </>
      ) : (
        <>
          {props.navigationState.routes.map((route, index) => {
            const isFocused = props.navigationState.index === index;

            return route.key === "settings" ? (
              <SettingsIcon
                isFocused={isFocused}
                jumpTo={props.jumpTo}
                route={route}
              />
            ) : (
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
                  width: "25%"
                }}
                type={isFocused ? "selected" : "plain"}
              >
                <Icon
                  name={getIcon(route.key)}
                  color={
                    isFocused ? colors.primary.accent : colors.primary.icon
                  }
                  size={SIZE.lg}
                />
                <Paragraph
                  color={
                    isFocused
                      ? colors.primary.paragraph
                      : colors.secondary.paragraph
                  }
                  size={SIZE.xxxs - 1}
                >
                  {route.title}
                </Paragraph>
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
};
