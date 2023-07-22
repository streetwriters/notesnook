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

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { SafeAreaView } from "react-native";
import Container from "../components/container";
import DelayLayout from "../components/delay-layout";
import Intro from "../components/intro";
import { TopicsSheet } from "../components/sheets/topic-sheet";
import useGlobalSafeAreaInsets from "../hooks/use-global-safe-area-insets";
import { hideAllTooltips } from "../hooks/use-tooltip";
import Favorites from "../screens/favorites";
import Home from "../screens/home";
import Notebook from "../screens/notebook";
import Notebooks from "../screens/notebooks";
import { ColoredNotes } from "../screens/notes/colored";
import { Monographs } from "../screens/notes/monographs";
import { TaggedNotes } from "../screens/notes/tagged";
import { TopicNotes } from "../screens/notes/topic-notes";
import Reminders from "../screens/reminders";
import { Search } from "../screens/search";
import Settings from "../screens/settings";
import AppLock from "../screens/settings/app-lock";
import Tags from "../screens/tags";
import Trash from "../screens/trash";
import { eSendEvent } from "../services/event-manager";
import SettingsService from "../services/settings";
import useNavigationStore from "../stores/use-navigation-store";
import { useNoteStore } from "../stores/use-notes-store";
import { useSelectionStore } from "../stores/use-selection-store";
import { useSettingStore } from "../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { rootNavigatorRef } from "../utils/global-refs";
import Auth from "../components/auth";
const NativeStack = createNativeStackNavigator();
const IntroStack = createNativeStackNavigator();

/**
 * Intro Stack:
 *
 * Welcome Page
 * Select Privacy Mode Page
 * Login/Signup Page
 *
 */

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
      <NativeStack.Screen name="Auth" component={Auth} />
      <NativeStack.Screen name="AppLock" component={AppLock} />
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
  const loading = useNoteStore((state) => state.loading);
  const insets = useGlobalSafeAreaInsets();
  const screenHeight = height - (50 + insets.top + insets.bottom);
  React.useEffect(() => {
    setTimeout(() => {
      useNavigationStore.getState().update({ name: homepage });
    }, 1000);
  }, [homepage]);

  return loading && introCompleted ? (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.primary.background
        }}
      >
        <DelayLayout animated={false} wait={loading} />
      </SafeAreaView>
    </>
  ) : (
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
      <NativeStack.Screen
        options={{ lazy: true }}
        name="Favorites"
        component={Favorites}
      />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="Trash"
        component={Trash}
      />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="Tags"
        component={Tags}
      />
      <NativeStack.Screen name="Settings" component={Settings} />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="TaggedNotes"
        component={TaggedNotes}
      />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="TopicNotes"
        component={TopicNotes}
      />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="ColoredNotes"
        component={ColoredNotes}
      />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="Reminders"
        component={Reminders}
      />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="Monographs"
        initialParams={{
          item: { type: "monograph" },
          canGoBack: false,
          title: "Monographs"
        }}
        component={Monographs}
      />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="Notebook"
        component={Notebook}
      />
      <NativeStack.Screen
        options={{ lazy: true }}
        name="Search"
        component={Search}
      />
    </NativeStack.Navigator>
  );
};
const Tabs = React.memo(_Tabs, () => true);

const _NavigationStack = () => {
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const loading = useNoteStore((state) => state.loading);
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
      {loading ? null : <TopicsSheet />}
    </Container>
  );
};
export const NavigationStack = React.memo(_NavigationStack, () => true);
