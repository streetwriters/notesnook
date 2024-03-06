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
import { View } from "react-native";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import { Toast } from "../toast";
import { initialAuthMode } from "./common";
import { Login } from "./login";
import { Signup } from "./signup";

export const AuthMode = {
  login: 0,
  signup: 1,
  welcomeSignup: 2,
  trialSignup: 3
};

const Auth = ({ navigation, route }) => {
  const [currentAuthMode, setCurrentAuthMode] = useState(
    route?.params?.mode || AuthMode.login
  );
  initialAuthMode.current = route?.params.mode || AuthMode.login;
  useNavigationFocus(navigation, {
    onFocus: () => {
      //tabBarRef?.current.lock();
      initialAuthMode.current = route?.params.mode || AuthMode.login;
    }
  });

  return (
    <View style={{ flex: 1 }}>
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
