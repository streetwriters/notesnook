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
import { useNetInfo } from "@react-native-community/netinfo";
import React from "react";
import { ActivityIndicator, Image, Platform, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import useSyncProgress from "../../hooks/use-sync-progress";
import { eSendEvent } from "../../services/event-manager";
import Sync from "../../services/sync";
import { SyncStatus, useUserStore } from "../../stores/use-user-store";
import { eOpenLoginDialog } from "../../utils/events";
import { tabBarRef } from "../../utils/global-refs";
import { SIZE } from "../../utils/size";
import { Pressable } from "../ui/pressable";
import { TimeSince } from "../ui/time-since";
import Paragraph from "../ui/typography/paragraph";

const PROFILE_PIC_URL = `https://picsum.photos/id/177/367/267`;

export const UserStatus = () => {
  const { colors } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const syncing = useUserStore((state) => state.syncing);
  const lastSyncStatus = useUserStore((state) => state.lastSyncStatus);
  const lastSynced = useUserStore((state) => state.lastSynced);
  const insets = useGlobalSafeAreaInsets();
  const { isInternetReachable } = useNetInfo();
  const isOffline = !isInternetReachable;
  const { progress } = useSyncProgress();
  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingBottom: Platform.OS === "ios" ? insets.bottom / 2 : null,
        borderTopWidth: 1,
        borderTopColor: colors.secondary.background
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
          onPress={async () => {
            if (user) {
              Sync.run();
            } else {
              tabBarRef.current?.closeDrawer();
              eSendEvent(eOpenLoginDialog);
            }
          }}
          type="plain"
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            padding: 12,
            borderRadius: 0,
            alignItems: "center"
          }}
        >
          {user ? (
            <Image
              source={{
                uri: PROFILE_PIC_URL
              }}
              style={{
                width: 35,
                height: 35,
                borderRadius: 100,
                backgroundColor: "red",
                marginRight: 10
              }}
            />
          ) : null}

          <View
            style={{
              flexShrink: 1,
              flexGrow: 1
            }}
          >
            <Paragraph
              style={{
                flexWrap: "wrap"
              }}
              size={SIZE.sm}
              color={colors.primary.heading}
            >
              {!user
                ? "Login to sync your notes."
                : lastSyncStatus === SyncStatus.Failed
                ? "Sync failed, tap to retry"
                : syncing
                ? `Syncing your notes${
                    progress ? ` (${progress.current})` : ""
                  }`
                : "Ammar Ahmed"}
            </Paragraph>

            <Paragraph
              style={{
                flexWrap: "wrap"
              }}
              size={SIZE.xs}
              color={colors.secondary.heading}
            >
              {!user ? (
                "Not logged in"
              ) : lastSynced && lastSynced !== "Never" ? (
                <>
                  {lastSyncStatus === SyncStatus.Failed
                    ? "Sync failed"
                    : "Synced"}{" "}
                  <TimeSince
                    style={{
                      fontSize: SIZE.xs,
                      color: colors.secondary.paragraph
                    }}
                    time={lastSynced}
                  />
                  {isOffline ? " (offline)" : ""}
                </>
              ) : (
                "never"
              )}{" "}
              <Icon
                name="checkbox-blank-circle"
                size={11}
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

          {user ? (
            syncing ? (
              <ActivityIndicator color={colors.primary.accent} size={SIZE.xl} />
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
                color={colors.primary.accent}
                name="sync"
                size={SIZE.lg}
              />
            )
          ) : null}
        </Pressable>
      </View>
    </View>
  );
};
