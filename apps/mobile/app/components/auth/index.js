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

import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import { Toast } from "../toast";
import { AuthMode, initialAuthMode } from "./common";
import { Login } from "./login";
import { Signup } from "./signup";
import { useThemeColors } from "@notesnook/theme";

const Auth = ({ navigation, route }) => {
  const [currentAuthMode, setCurrentAuthMode] = useState(
    route?.params?.mode || AuthMode.login
  );
  const { colors } = useThemeColors();
  initialAuthMode.current = route?.params.mode || AuthMode.login;
  useNavigationFocus(navigation, {});

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.primary.background }}
    >
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
    </SafeAreaView>
  );
};

export default Auth;
