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

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import useNavigationStore from "../../stores/use-navigation-store";
import { useThemeColors } from "@notesnook/theme";
import Group from "./group";
import Home from "./home";
import { RouteParams } from "./types";
import { SafeAreaView } from "react-native-safe-area-context";
const SettingsStack = createNativeStackNavigator<RouteParams>();

export const Settings = () => {
  const { colors } = useThemeColors();
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.primary.background
      }}
    >
      <SettingsStack.Navigator
        initialRouteName="SettingsHome"
        screenListeners={{
          focus: (e) => {
            if (e.target?.startsWith("SettingsHome-")) {
              useNavigationStore.getState().update("Settings");
            }
          }
        }}
        screenOptions={{
          animation: "none",
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.primary.background
          }
        }}
      >
        <SettingsStack.Screen name="SettingsHome" component={Home} />
        <SettingsStack.Screen name="SettingsGroup" component={Group} />
      </SettingsStack.Navigator>
    </SafeAreaView>
  );
};

export default Settings;
