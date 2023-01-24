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
import React, { useEffect } from "react";
import { View } from "react-native";
import { Button } from "../../components/ui/button";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastEvent } from "../../services/event-manager";
import SettingsService from "../../services/settings";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import {
  SplitModuleLoader,
  useIsGeckoViewEnabled,
  useSplitInstallSessionState
} from "../../utils/split-module-loader";
export const GeckoViewLoader = () => {
  const { enabled, installed } = useIsGeckoViewEnabled();
  const colors = useThemeStore((state) => state.colors);
  const state = useSplitInstallSessionState();
  useEffect(() => {
    if (state?.status === "installed") {
      SettingsService.set({
        useGeckoView: true
      });
    }
  }, [state?.status]);

  return (
    <View
      style={{
        width: "100%",
        marginTop: 10
      }}
    >
      <>
        <Paragraph
          style={{ marginTop: 10, marginBottom: 10 }}
          color={colors.icon}
          size={SIZE.sm}
        >
          {installed
            ? "GeckoView is already downloaded & installed on this device."
            : "Installing GeckoView will download additional data on your phone."}
        </Paragraph>

        {state?.status === "downloading" ||
        state?.status === "installing" ||
        state?.status === "pending" ? (
          <Paragraph>Installing</Paragraph>
        ) : (
          <>
            {!installed ? (
              <Button
                title="Install GeckoView"
                type="accent"
                style={{
                  borderRadius: 100,
                  width: 250,
                  alignSelf: "flex-start"
                }}
                onPress={async () => {
                  try {
                    await SplitModuleLoader.installModule("geckoview");
                    SettingsService.set({
                      useGeckoView: true
                    });
                  } catch (e) {
                    ToastEvent.error(e as Error);
                  }
                }}
              />
            ) : (
              <Button
                title={enabled ? "Disable GeckoView" : "Enable GeckoView"}
                type="accent"
                style={{
                  borderRadius: 100,
                  width: 250,
                  alignSelf: "flex-start"
                }}
                onPress={() => {
                  SettingsService.set({
                    useGeckoView: !enabled
                  });
                }}
              />
            )}
          </>
        )}

        {state ? (
          <Paragraph
            style={{ marginTop: 10 }}
            color={colors.icon}
            size={SIZE.xs + 1}
          >
            {state.status}
          </Paragraph>
        ) : null}
      </>
    </View>
  );
};
