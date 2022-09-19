/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import React from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import useSyncProgress from "../../hooks/use-sync-progress";
import { eSendEvent } from "../../services/event-manager";
import Sync from "../../services/sync";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import { eOpenLoginDialog } from "../../utils/events";
import { tabBarRef } from "../../utils/global-refs";
import { SIZE } from "../../utils/size";
import { PressableButton } from "../ui/pressable";
import { TimeSince } from "../ui/time-since";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
export const UserStatus = () => {
  const colors = useThemeStore((state) => state.colors);
  const user = useUserStore((state) => state.user);
  const syncing = useUserStore((state) => state.syncing);
  const lastSynced = useUserStore((state) => state.lastSynced);
  const insets = useGlobalSafeAreaInsets();
  const { progress } = useSyncProgress();
  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingBottom: Platform.OS === "ios" ? insets.bottom / 2 : null,
        borderTopWidth: 1,
        borderTopColor: colors.nav
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <PressableButton
          onPress={async () => {
            if (user) {
              Sync.run();
            } else {
              tabBarRef.current?.closeDrawer();
              eSendEvent(eOpenLoginDialog);
            }
          }}
          type="gray"
          customStyle={{
            flexDirection: "row",
            justifyContent: "flex-start",
            padding: 12,
            paddingHorizontal: 20,
            borderRadius: 0
          }}
        >
          <View
            style={{
              flexShrink: 1,
              flexGrow: 1
            }}
          >
            <Heading
              style={{
                flexWrap: "wrap"
              }}
              size={SIZE.xs}
              color={colors.icon}
            >
              {!user ? (
                "You are not logged in"
              ) : !syncing ? (
                lastSynced && lastSynced !== "Never" ? (
                  <>
                    Last synced{" "}
                    <TimeSince
                      style={{ fontSize: SIZE.xs, color: colors.icon }}
                      time={lastSynced}
                    />
                  </>
                ) : (
                  "never"
                )
              ) : (
                `Syncing your notes${
                  progress ? ` (${progress.current}/${progress.total})` : ""
                }`
              )}{" "}
              <Icon
                name="checkbox-blank-circle"
                size={9}
                color={!user ? colors.red : colors.green}
              />
            </Heading>

            <Paragraph
              style={{
                flexWrap: "wrap"
              }}
              color={colors.heading}
            >
              {!user
                ? "Login to sync your notes."
                : "Tap here to sync your notes."}
            </Paragraph>
          </View>

          {user ? (
            syncing ? (
              <>
                <ActivityIndicator color={colors.accent} size={SIZE.xl} />
              </>
            ) : (
              <Icon color={colors.accent} name="sync" size={SIZE.lg} />
            )
          ) : null}
        </PressableButton>
      </View>
    </View>
  );
};
