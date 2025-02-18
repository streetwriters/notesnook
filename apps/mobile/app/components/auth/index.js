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
import React, { useState } from "react";
import { View } from "react-native";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import Navigation from "../../services/navigation";
import { Toast } from "../toast";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { AuthMode, initialAuthMode } from "./common";
import { Login } from "./login";
import { Signup } from "./signup";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";

const Auth = ({ navigation, route }) => {
  const [currentAuthMode, setCurrentAuthMode] = useState(
    route?.params?.mode || AuthMode.login
  );
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();
  initialAuthMode.current = route?.params.mode || AuthMode.login;
  useNavigationFocus(navigation, {});

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          position: "absolute",
          paddingTop: insets.top,
          top: 0,
          zIndex: 999,
          backgroundColor: colors.secondary.background,
          width: "100%"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            width: "100%",
            height: 50,
            justifyContent:
              initialAuthMode.current !== AuthMode.welcomeSignup
                ? "space-between"
                : "flex-end"
          }}
        >
          {initialAuthMode.current === AuthMode.welcomeSignup ? null : (
            <IconButton
              name="arrow-left"
              onPress={() => {
                if (initialAuthMode.current === 2) {
                  Navigation.replace("FluidPanelsView");
                } else {
                  Navigation.goBack();
                }
              }}
              color={colors.primary.paragraph}
            />
          )}

          {initialAuthMode.current !== AuthMode.welcomeSignup ? null : (
            <Button
              title={strings.skip()}
              onPress={() => {
                if (initialAuthMode.current === 2) {
                  Navigation.replace("FluidPanelsView");
                } else {
                  Navigation.goBack();
                }
              }}
              iconSize={16}
              type="plain"
              iconPosition="right"
              icon="chevron-right"
              height={25}
              iconStyle={{
                marginTop: 2
              }}
              style={{
                paddingHorizontal: 6
              }}
            />
          )}
        </View>
      </View>

      {currentAuthMode !== AuthMode.login ? (
        <Signup
          changeMode={(mode) => setCurrentAuthMode(mode)}
          trial={AuthMode.trialSignup === currentAuthMode}
          welcome={initialAuthMode.current === AuthMode.welcomeSignup}
        />
      ) : (
        <Login
          welcome={initialAuthMode.current}
          changeMode={(mode) => setCurrentAuthMode(mode)}
        />
      )}

      <Toast context="local" />
    </View>
  );
};

export default Auth;
