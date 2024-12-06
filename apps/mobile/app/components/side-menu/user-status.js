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
import { useNetInfo } from "@react-native-community/netinfo";
import React from "react";
import { ActivityIndicator, Image, Platform, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import useSyncProgress from "../../hooks/use-sync-progress";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import Sync from "../../services/sync";
import { useThemeStore } from "../../stores/use-theme-store";
import { SyncStatus, useUserStore } from "../../stores/use-user-store";
import { eOpenLoginDialog } from "../../utils/events";
import { fluidTabsRef } from "../../utils/global-refs";
import { SIZE } from "../../utils/size";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import { TimeSince } from "../ui/time-since";
import Paragraph from "../ui/typography/paragraph";

export const UserStatus = () => {
  const { colors, isDark } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const syncing = useUserStore((state) => state.syncing);
  const lastSyncStatus = useUserStore((state) => state.lastSyncStatus);
  const lastSynced = useUserStore((state) => state.lastSynced);
  const insets = useGlobalSafeAreaInsets();
  const { isInternetReachable } = useNetInfo();
  const isOffline = !isInternetReachable;
  const { progress } = useSyncProgress();
  const userProfile = useUserStore((state) => state.profile);

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingBottom: Platform.OS === "ios" ? insets.bottom / 2 : null,
        borderTopWidth: 1,
        borderTopColor: colors.primary.border,
        backgroundColor: colors.primary.background
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Pressable
          onPress={() => {
            Navigation.navigate("Settings");
            fluidTabsRef.current.closeDrawer();
          }}
          type="plain"
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            padding: 12,
            borderRadius: 0,
            alignItems: "center",
            gap: 10
          }}
        >
          {userProfile?.profilePicture ? (
            <Image
              source={{
                uri: userProfile?.profilePicture
              }}
              style={{
                width: 35,
                height: 35,
                borderRadius: 100
              }}
            />
          ) : (
            <Icon
              name="cog-outline"
              size={SIZE.lg - 2}
              color={colors.secondary.icon}
              style={{
                paddingLeft: 8
              }}
            />
          )}

          <View
            style={{
              flexShrink: 1,
              flexGrow: 1
            }}
          >
            <Paragraph
              numberOfLines={1}
              size={SIZE.sm}
              color={colors.primary.heading}
            >
              {!user || !userProfile?.fullName
                ? strings.settings()
                : userProfile.fullName}
            </Paragraph>

            <Paragraph
              style={{
                flexWrap: "wrap"
              }}
              size={SIZE.xs}
              color={colors.secondary.heading}
            >
              {!user ? (
                strings.notLoggedIn()
              ) : lastSynced && lastSynced !== "Never" ? (
                <>
                  {syncing
                    ? `${strings.syncing()} ${
                        progress ? `(${progress.current})` : ""
                      }`
                    : lastSyncStatus === SyncStatus.Failed
                    ? strings.syncFailed()
                    : strings.synced()}{" "}
                  {!syncing ? (
                    <TimeSince
                      style={{
                        fontSize: SIZE.xs,
                        color: colors.secondary.paragraph
                      }}
                      time={lastSynced}
                    />
                  ) : null}
                  {isOffline ? ` (${strings.offline()})` : ""}
                </>
              ) : (
                strings.never()
              )}{" "}
              <Icon
                name="checkbox-blank-circle"
                size={9}
                allowFontScaling
                color={
                  !user || lastSyncStatus === SyncStatus.Failed
                    ? colors.error.icon
                    : isOffline
                    ? colors.static.orange
                    : colors.success.icon
                }
              />
            </Paragraph>
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 0
            }}
          >
            <IconButton
              hitSlop={{
                top: 10,
                bottom: 10
              }}
              onPress={() => {
                useThemeStore.getState().setColorScheme();
              }}
              name="theme-light-dark"
              color={isDark ? colors.primary.accent : colors.primary.icon}
              size={SIZE.lg}
              style={{
                borderRadius: 100,
                width: 40,
                height: 40
              }}
            />

            <Pressable
              style={{
                borderRadius: 100,
                width: 40,
                height: 40
              }}
              hitSlop={{
                top: 10,
                bottom: 10
              }}
              onPress={() => {
                if (user) {
                  Sync.run();
                } else {
                  fluidTabsRef.current?.closeDrawer();
                  eSendEvent(eOpenLoginDialog);
                }
              }}
            >
              {user ? (
                syncing ? (
                  <ActivityIndicator
                    color={colors.primary.accent}
                    size={SIZE.xl}
                  />
                ) : lastSyncStatus === SyncStatus.Failed ? (
                  <Icon
                    color={colors.error.icon}
                    name="sync-alert"
                    size={SIZE.lg}
                    allowFontScaling
                  />
                ) : (
                  <Icon
                    allowFontScaling
                    color={colors.primary.icon}
                    name="sync"
                    size={SIZE.lg}
                  />
                )
              ) : (
                <Icon
                  allowFontScaling
                  color={colors.primary.accent}
                  size={SIZE.lg}
                  name="login"
                />
              )}
            </Pressable>
          </View>
        </Pressable>
      </View>
    </View>
  );
};
