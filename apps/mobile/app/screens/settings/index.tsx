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
const SettingsStack = createNativeStackNavigator<RouteParams>();

// const Home = React.lazy(() => import(/* webpackChunkName: "settings-home" */ './home'));
// const Group = React.lazy(() => import(/* webpackChunkName: "settings-group" */ './group'));

// const Fallback = () => {
//   return (
//     <>
//       <Header />
//       <DelayLayout wait={true} type="settings" />
//     </>
//   );
// };

// const HomeScreen = (props: NativeStackScreenProps<RouteParams, 'SettingsHome'>) => {
//   return (
//     <React.Suspense fallback={<Fallback />}>
//       <Home {...props} />
//     </React.Suspense>
//   );
// };

// const GroupScreen = (props: NativeStackScreenProps<RouteParams, 'SettingsGroup'>) => {
//   return (
//     <React.Suspense fallback={<Fallback />}>
//       <Group {...props} />
//     </React.Suspense>
//   );
// };

export const Settings = () => {
  const { colors } = useThemeColors();
  return (
    <SettingsStack.Navigator
      initialRouteName="SettingsHome"
      screenListeners={{
        beforeRemove: (e) => {
          if (e.target?.startsWith("SettingsGroup")) {
            useNavigationStore.getState().update({ name: "Settings" }, false);
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
  );
};

export default Settings;
