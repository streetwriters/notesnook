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
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import Container from "../components/container";
import Intro from "../components/intro";
import { NotebookSheet } from "../components/sheets/notebook-sheet";
import useGlobalSafeAreaInsets from "../hooks/use-global-safe-area-insets";
import { hideAllTooltips } from "../hooks/use-tooltip";
import Favorites from "../screens/favorites";
import Home from "../screens/home";
import NotebookScreen from "../screens/notebook";
import Notebooks from "../screens/notebooks";
import { ColoredNotes } from "../screens/notes/colored";
import { Monographs } from "../screens/notes/monographs";
import { TaggedNotes } from "../screens/notes/tagged";
import Reminders from "../screens/reminders";
import { Search } from "../screens/search";
import Settings from "../screens/settings";
import Tags from "../screens/tags";
import Trash from "../screens/trash";
import { eSendEvent } from "../services/event-manager";
import SettingsService from "../services/settings";
import useNavigationStore from "../stores/use-navigation-store";
import { useSelectionStore } from "../stores/use-selection-store";
import { useSettingStore } from "../stores/use-setting-store";
import { rootNavigatorRef } from "../utils/global-refs";

const NativeStack = createNativeStackNavigator();
const IntroStack = createNativeStackNavigator();

const IntroStackNavigator = () => {
  const { colors } = useThemeColors();
  const height = useSettingStore((state) => state.dimensions.height);
  return (
    <IntroStack.Navigator
      screenOptions={{
        headerShown: false,
        lazy: false,
        animation: "none",
        contentStyle: {
          backgroundColor: colors.primary.background,
          minHeight: height
        }
      }}
      initialRouteName={"Intro"}
    >
      <NativeStack.Screen name="Intro" component={Intro} />
    </IntroStack.Navigator>
  );
};

const _Tabs = () => {
  const { colors } = useThemeColors();
  const homepage = SettingsService.get().homepage;
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );

  const height = useSettingStore((state) => state.dimensions.height);
  const insets = useGlobalSafeAreaInsets();
  const screenHeight = height - (50 + insets.top + insets.bottom);
  React.useEffect(() => {
    setTimeout(async () => {
      useNavigationStore.getState().update(homepage);
    }, 1000);
  }, [homepage]);

  return (
    <NativeStack.Navigator
      tabBar={() => null}
      initialRouteName={!introCompleted ? "Welcome" : homepage}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        lazy: false,
        animation: "none",
        contentStyle: {
          backgroundColor: colors.primary.background,
          minHeight: !introCompleted ? undefined : screenHeight
        }
      }}
    >
      <NativeStack.Screen name="Welcome" component={IntroStackNavigator} />
      <NativeStack.Screen name="Notes" component={Home} />
      <NativeStack.Screen name="Notebooks" component={Notebooks} />
      <NativeStack.Screen name="Favorites" component={Favorites} />
      <NativeStack.Screen name="Trash" component={Trash} />
      <NativeStack.Screen name="Tags" component={Tags} />
      <NativeStack.Screen name="Settings" component={Settings} />
      <NativeStack.Screen name="TaggedNotes" component={TaggedNotes} />
      <NativeStack.Screen name="ColoredNotes" component={ColoredNotes} />
      <NativeStack.Screen name="Reminders" component={Reminders} />
      <NativeStack.Screen
        name="Monographs"
        initialParams={{
          item: { type: "monograph" },
          canGoBack: false,
          title: strings.monographs()
        }}
        component={Monographs}
      />
      <NativeStack.Screen name="Notebook" component={NotebookScreen} />
      <NativeStack.Screen name="Search" component={Search} />
    </NativeStack.Navigator>
  );
};
const Tabs = React.memo(_Tabs, () => true);

const _NavigationStack = () => {
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const loading = useSettingStore((state) => state.isAppLoading);
  const onStateChange = React.useCallback(() => {
    if (useSelectionStore.getState().selectionMode) {
      clearSelection(true);
    }
    hideAllTooltips();
    eSendEvent("navigate");
  }, [clearSelection]);

  return (
    <Container>
      <NavigationContainer onStateChange={onStateChange} ref={rootNavigatorRef}>
        <Tabs />
      </NavigationContainer>
      {loading ? null : <NotebookSheet />}
    </Container>
  );
};
export const NavigationStack = React.memo(_NavigationStack, () => true);
