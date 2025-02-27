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
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { hideAllTooltips } from "../hooks/use-tooltip";
import SettingsService from "../services/settings";
import useNavigationStore, {
  RouteParams
} from "../stores/use-navigation-store";
import { useSelectionStore } from "../stores/use-selection-store";
import { useSettingStore } from "../stores/use-setting-store";
import { rootNavigatorRef } from "../utils/global-refs";

const RootStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

let Notes: any = null;
let Notebook: any = null;
let Search: any = null;
let Favorites: any = null;
let Trash: any = null;
let Reminders: any = null;
let Monographs: any = null;
let TaggedNotes: any = null;
let ColoredNotes: any = null;

const AppNavigation = React.memo(
  () => {
    const { colors } = useThemeColors();
    const homepage = SettingsService.get().homepage;
    React.useEffect(() => {
      setTimeout(() => {
        useNavigationStore.getState().update(homepage as keyof RouteParams);
        useNavigationStore.getState().setFocusedRouteId(homepage);
      }, 300);
    }, [homepage]);

    return (
      <AppStack.Navigator
        initialRouteName={homepage}
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: {
            backgroundColor: colors.primary.background
          }
        }}
      >
        <AppStack.Screen
          name="Notes"
          getComponent={() => {
            Notes = Notes || require("../screens/home").default;
            return Notes;
          }}
        />

        <AppStack.Screen
          name="Favorites"
          getComponent={() => {
            Favorites = Favorites || require("../screens/favorites").default;
            return Favorites;
          }}
        />

        <AppStack.Screen
          name="Trash"
          getComponent={() => {
            Trash = Trash || require("../screens/trash").default;
            return Trash;
          }}
        />

        <AppStack.Screen
          name="TaggedNotes"
          getComponent={() => {
            TaggedNotes =
              TaggedNotes || require("../screens/notes/tagged").default;
            return TaggedNotes;
          }}
        />

        <AppStack.Screen
          name="ColoredNotes"
          getComponent={() => {
            ColoredNotes =
              ColoredNotes || require("../screens/notes/colored").default;
            return ColoredNotes;
          }}
        />

        <AppStack.Screen
          name="Reminders"
          getComponent={() => {
            Reminders = Reminders || require("../screens/reminders").default;
            return Reminders;
          }}
        />

        <AppStack.Screen
          name="Monographs"
          getComponent={() => {
            Monographs =
              Monographs || require("../screens/notes/monographs").default;
            return Monographs;
          }}
        />

        <AppStack.Screen
          name="Notebook"
          getComponent={() => {
            Notebook = Notebook || require("../screens/notebook").default;
            return Notebook;
          }}
        />

        <AppStack.Screen
          name="Search"
          getComponent={() => {
            Search = Search || require("../screens/search").default;
            return Search;
          }}
        />
      </AppStack.Navigator>
    );
  },
  () => true
);
AppNavigation.displayName = "AppNavigation";

let Intro: any = null;
let Auth: any = null;
let FluidPanelsView: any = null;
let LinkNotebooks: any = null;
let MoveNotebook: any = null;
let MoveNotes: any = null;
let Settings: any = null;

export const RootNavigation = () => {
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );
  const clearSelection = useSelectionStore((state) => state.clearSelection);
  const onStateChange = React.useCallback(() => {
    if (useSelectionStore.getState().selectionMode) {
      clearSelection();
    }
    hideAllTooltips();
  }, [clearSelection]);

  return (
    <NavigationContainer onStateChange={onStateChange} ref={rootNavigatorRef}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false
        }}
        initialRouteName={introCompleted ? "FluidPanelsView" : "Welcome"}
      >
        <RootStack.Screen
          name="Welcome"
          getComponent={() => {
            Intro = Intro || require("../components/intro").default;
            return Intro;
          }}
        />
        <RootStack.Screen
          name="Auth"
          getComponent={() => {
            Auth = Auth || require("../components/auth").default;
            return Auth;
          }}
        />

        <RootStack.Screen
          name="FluidPanelsView"
          getComponent={() => {
            FluidPanelsView =
              FluidPanelsView ||
              require("../navigation/fluid-panels-view").default;
            return FluidPanelsView;
          }}
        />

        <RootStack.Screen
          name="LinkNotebooks"
          getComponent={() => {
            LinkNotebooks =
              LinkNotebooks || require("../screens/link-notebooks").default;
            return LinkNotebooks;
          }}
        />

        <RootStack.Screen
          name="MoveNotebook"
          getComponent={() => {
            MoveNotebook =
              MoveNotebook || require("../screens/move-notebook").default;
            return MoveNotebook;
          }}
        />

        <RootStack.Screen
          name="MoveNotes"
          getComponent={() => {
            MoveNotes = MoveNotes || require("../screens/move-notes").default;
            return MoveNotes;
          }}
        />

        <RootStack.Screen
          name="Settings"
          getComponent={() => {
            Settings = Settings || require("../screens/settings").default;
            return Settings;
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export const AppNavigationStack = React.memo(
  () => {
    return <AppNavigation />;
  },
  () => true
);
AppNavigationStack.displayName = "AppNavigationStack";
