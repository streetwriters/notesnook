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

import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { eCloseLoginDialog, eOpenLoginDialog } from "../../utils/events";
import { sleep } from "../../utils/time";
import BaseDialog from "../dialog/base-dialog";
import { Toast } from "../toast";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { hideAuth, initialAuthMode } from "./common";
import { Login } from "./login";
import { Signup } from "./signup";

export const AuthMode = {
  login: 0,
  signup: 1,
  welcomeSignup: 2,
  trialSignup: 3
};

const AuthModal = () => {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [currentAuthMode, setCurrentAuthMode] = useState(AuthMode.login);
  const actionSheetRef = useRef();
  const insets = useGlobalSafeAreaInsets();

  useEffect(() => {
    eSubscribeEvent(eOpenLoginDialog, open);
    eSubscribeEvent(eCloseLoginDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenLoginDialog, open);
      eUnSubscribeEvent(eCloseLoginDialog, close);
    };
  }, []);

  async function open(mode) {
    setCurrentAuthMode(mode ? mode : AuthMode.login);
    initialAuthMode.current = mode ? mode : AuthMode.login;
    setVisible(true);
    await sleep(10);
    actionSheetRef.current?.show();
  }

  const close = () => {
    actionSheetRef.current?.hide();
    setCurrentAuthMode(AuthMode.login);
    setVisible(false);
  };

  return !visible ? null : (
    <BaseDialog
      overlayOpacity={0}
      statusBarTranslucent={false}
      onRequestClose={currentAuthMode !== AuthMode.welcomeSignup && close}
      visible={true}
      onClose={close}
      useSafeArea={false}
      bounce={false}
      background={colors.primary.background}
      transparent={false}
      animated={false}
    >
      {currentAuthMode !== AuthMode.login ? (
        <Signup
          changeMode={(mode) => setCurrentAuthMode(mode)}
          trial={AuthMode.trialSignup === currentAuthMode}
          welcome={initialAuthMode.current === AuthMode.welcomeSignup}
        />
      ) : (
        <Login
          welcome={initialAuthMode.current === AuthMode.welcomeSignup}
          changeMode={(mode) => setCurrentAuthMode(mode)}
        />
      )}

      <View
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? insets.top : 0,
          zIndex: 999,
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
              hideAuth();
            }}
            color={colors.primary.paragraph}
          />
        )}

        {initialAuthMode.current !== AuthMode.welcomeSignup ? null : (
          <Button
            title="Skip for now"
            onPress={() => {
              hideAuth();
            }}
            iconSize={20}
            type="gray"
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

      <Toast context="local" />
    </BaseDialog>
  );
};

export default AuthModal;
