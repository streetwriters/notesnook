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
import { getObfuscatedEmail } from "../../../utils/functions";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { AuthMode } from "../../auth/common";
import { Card } from "../../list/card";
import AppIcon from "../../ui/AppIcon";
import { Pressable } from "../../ui/pressable";
import { TimeSince } from "../../ui/time-since";
import Paragraph from "../../ui/typography/paragraph";
import Sync from "../../../services/sync";

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
        gap: DefaultAppStyles.GAP
      }}
    >
      {user ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: DefaultAppStyles.GAP,
            gap: DefaultAppStyles.GAP_SMALL
          }}
        >
          {userProfile?.profilePicture ? (
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
          ) : null}

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between"
            }}
          >
            <View>
              <Paragraph size={AppFontSize.xs}>
                {userProfile?.fullName || getObfuscatedEmail(user.email)}
              </Paragraph>
              <Paragraph
                style={{
                  flexWrap: "wrap"
                }}
                size={AppFontSize.xxs}
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
                          fontSize: AppFontSize.xxs,
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
                )}{" "}
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
                />
              </Paragraph>
            </View>
            {syncing ? (
              <ActivityIndicator
                color={colors.primary.accent}
                size={AppFontSize.xxl}
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
          <Card
            customMessage={{
              visible: true,
              message: strings.notLoggedIn(),
              actionText: strings.loginMessageActionText(),
              icon: "account-outline",
              onPress: () => {
                ref.current?.hide();
                Navigation.navigate("Auth", {
                  mode: AuthMode.login
                });
              }
            }}
          />
        </View>
      )}

      {/* {user ? (
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
              <Paragraph size={AppFontSize.xxs}>{strings.storage()}</Paragraph>
              <Paragraph size={AppFontSize.xxs}>
                50/100MB {strings.used()}
              </Paragraph>
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
              <Paragraph size={AppFontSize.sm}>{strings.freePlan()}</Paragraph>
              <Paragraph
                color={colors.secondary.paragraph}
                size={AppFontSize.xxxs}
              >
                {strings.viewAllLimits()}
                <AppIcon name="information" size={AppFontSize.xxxs} />
              </Paragraph>
            </View>

            <Button
              title={strings.upgradeNow()}
              onPress={() => {}}
              type="accent"
              fontSize={AppFontSize.xs}
              style={{
                paddingHorizontal: DefaultAppStyles.GAP_SMALL,
                height: "auto",
                paddingVertical: DefaultAppStyles.GAP_SMALL
              }}
            />
          </View>
        </View>
      ) : null} */}

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
            icon: "reload",
            title: strings.syncNow(),
            onPress: () => {
              Sync.run();
            },
            hidden: !user
          },
          {
            icon: "cog-outline",
            title: strings.settings(),
            onPress: () => {
              ref.current?.hide();
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
                paddingHorizontal: DefaultAppStyles.GAP
              }}
              onPress={() => {
                item.onPress();
              }}
            >
              <AppIcon
                color={colors.secondary.icon}
                name={item.icon}
                size={AppFontSize.xl}
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
