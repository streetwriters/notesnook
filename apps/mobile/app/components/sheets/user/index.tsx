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
import { ActivityIndicator, Image, View } from "react-native";
import { useSheetRef } from "react-native-actions-sheet";
import useSyncProgress from "../../../hooks/use-sync-progress";
import { presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { SyncStatus, useUserStore } from "../../../stores/use-user-store";
import { SIZE } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { Card } from "../../list/card";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import { Pressable } from "../../ui/pressable";
import { TimeSince } from "../../ui/time-since";
import Paragraph from "../../ui/typography/paragraph";

export const UserSheet = () => {
  const ref = useSheetRef();
  const { colors } = useThemeColors();
  const [userProfile, user, syncing, lastSyncStatus, lastSynced] = useUserStore(
    (state) => [
      state.profile,
      state.user,
      state.syncing,
      state.lastSyncStatus,
      state.lastSynced
    ]
  );

  const { isInternetReachable } = useNetInfo();
  const isOffline = !isInternetReachable;
  const { progress } = useSyncProgress();

  return (
    <View
      style={{
        width: "100%",
        justifyContent: "center",
        paddingHorizontal: DefaultAppStyles.GAP,
        gap: DefaultAppStyles.GAP
      }}
    >
      {user ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          <Image
            source={{
              uri: userProfile?.profilePicture
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10
            }}
          />

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between"
            }}
          >
            <View style={{ marginLeft: 10 }}>
              <Paragraph size={SIZE.xs}>{userProfile?.fullName}</Paragraph>
              <Paragraph
                style={{
                  flexWrap: "wrap"
                }}
                size={SIZE.xxs}
                color={colors.secondary.heading}
              >
                <AppIcon
                  name="checkbox-blank-circle"
                  size={10}
                  allowFontScaling
                  color={
                    !user || lastSyncStatus === SyncStatus.Failed
                      ? colors.error.icon
                      : isOffline
                      ? colors.static.orange
                      : colors.success.icon
                  }
                />{" "}
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
                          fontSize: SIZE.xxs,
                          color: colors.secondary.paragraph
                        }}
                        updateFrequency={30 * 1000}
                        time={lastSynced as number}
                      />
                    ) : null}
                    {isOffline ? ` (${strings.offline()})` : ""}
                  </>
                ) : (
                  strings.never()
                )}
              </Paragraph>
            </View>
            {syncing ? (
              <ActivityIndicator
                color={colors.primary.accent}
                size={SIZE.xxl}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <View
          style={{
            width: "100%"
          }}
        >
          <Card />
        </View>
      )}

      {user ? (
        <View
          style={{
            paddingVertical: DefaultAppStyles.GAP_SMALL,
            gap: DefaultAppStyles.GAP,
            borderRadius: 10,
            backgroundColor: colors.primary.background
          }}
        >
          <View
            style={{
              gap: DefaultAppStyles.GAP_SMALL,
              paddingHorizontal: DefaultAppStyles.GAP_SMALL
            }}
          >
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                justifyContent: "space-between"
              }}
            >
              <Paragraph size={SIZE.xxs}>{strings.storage()}</Paragraph>
              <Paragraph size={SIZE.xxs}>50/100MB {strings.used()}</Paragraph>
            </View>
            <View
              style={{
                backgroundColor: colors.secondary.background,
                width: "100%",
                height: 5,
                borderRadius: 10
              }}
            >
              <View
                style={{
                  backgroundColor: colors.static.black,
                  height: 5,
                  width: "50%",
                  borderRadius: 10
                }}
              />
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              padding: DefaultAppStyles.GAP_SMALL,
              borderRadius: 10
            }}
          >
            <View>
              <Paragraph size={SIZE.sm}>{strings.freePlan()}</Paragraph>
              <Paragraph color={colors.secondary.paragraph} size={SIZE.xxxs}>
                {strings.viewAllLimits()}
                <AppIcon name="information" size={SIZE.xxxs} />
              </Paragraph>
            </View>

            <Button
              title={strings.upgradeNow()}
              onPress={() => {}}
              type="accent"
              fontSize={SIZE.xs}
              style={{
                paddingHorizontal: DefaultAppStyles.GAP_SMALL,
                height: "auto",
                paddingVertical: DefaultAppStyles.GAP_SMALL
              }}
            />
          </View>
        </View>
      ) : null}
      <View
        style={{
          borderBottomWidth: 1,
          height: 1,
          borderColor: colors.primary.border
        }}
      ></View>

      <View
        style={{
          gap: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        {[
          {
            icon: "account-outline",
            title: strings.editProfile(),
            onPress: () => {},
            hidden: !user
          },
          {
            icon: "cog-outline",
            title: strings.settings(),
            onPress: () => {
              ref.current?.hide();
              Navigation.closeDrawer();
              Navigation.navigate("Settings");
            }
          },
          {
            icon: "logout",
            title: strings.logout(),
            onPress: () => {
              ref.current?.hide();
            },
            hidden: !user
          }
        ].map((item) =>
          item.hidden ? null : (
            <Pressable
              key={item.title}
              style={{
                paddingVertical: DefaultAppStyles.GAP_SMALL,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "flex-start",
                gap: DefaultAppStyles.GAP_SMALL,
                paddingHorizontal: DefaultAppStyles.GAP_SMALL
              }}
              onPress={() => {
                item.onPress();
              }}
            >
              <AppIcon
                color={colors.secondary.icon}
                name={item.icon}
                size={SIZE.xl}
              />
              <Paragraph>{item.title}</Paragraph>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
};

UserSheet.present = () => {
  presentSheet({
    component: <UserSheet />
  });
};
