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
import { Image, Linking, View } from "react-native";
import { useSheetRef } from "react-native-actions-sheet";
import useSyncProgress from "../../../hooks/use-sync-progress";
import { presentSheet, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { SyncStatus, useUserStore } from "../../../stores/use-user-store";
import { getObfuscatedEmail } from "../../../utils/functions";
import { AppFontSize } from "../../../utils/size";
import { AuthMode } from "../../auth/common";
import { Card } from "../../list/card";
import AppIcon from "../../ui/AppIcon";
import { Pressable } from "../../ui/pressable";
import { TimeSince } from "../../ui/time-since";
import Paragraph from "../../ui/typography/paragraph";
import Sync from "../../../services/sync";
import { Radius, Spacing } from "../../../common/design/spacing";
import Clipboard from "@react-native-clipboard/clipboard";
import { logoutUser } from "../../../screens/settings/logout";
import { sleep } from "../../../utils/time";
import Heading from "../../ui/typography/heading";

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
  const canShowLastSyncedTime =
    !!user &&
    !!lastSynced &&
    lastSynced !== "Never" &&
    !syncing &&
    lastSyncStatus !== SyncStatus.Failed;

  const syncSubtitle = !user
    ? strings.notLoggedIn()
    : syncing
      ? `${strings.syncing()}${progress ? ` (${progress.current})` : ""}${isOffline ? ` (${strings.offline()})` : ""}`
      : lastSyncStatus === SyncStatus.Failed
        ? `${strings.syncFailed()}${isOffline ? ` (${strings.offline()})` : ""}`
        : canShowLastSyncedTime
          ? `Last synced${isOffline ? ` (${strings.offline()})` : ""}`
          : strings.never();

  const actionItems = [
    {
      key: "sync",
      icon: "user-sheet-sync",
      title: strings.syncNow(),
      subtitle: syncSubtitle,
      onPress: () => {
        if (!user) return;
        Sync.run();
      },
      hidden: !user
    },
    {
      key: "settings",
      icon: "user-sheet-settings",
      title: strings.settings(),
      subtitle: "Preferences & app lock",
      onPress: () => {
        ref.current?.hide();
        Navigation.navigate("Settings");
      }
    },
    {
      key: "support",
      icon: "user-sheet-support",
      title: strings.emailSupport(),
      subtitle: "Response within 24 hours",
      onPress: () => {
        Clipboard.setString("support@streetwriters.co");
        ToastManager.show({
          heading: strings.emailCopied(),
          type: "success",
          icon: "content-copy",
          context: "local"
        });
        setTimeout(() => {
          Linking.openURL("mailto:support@streetwriters.co").catch((e) => {
            ToastManager.show({
              message: "Could not open email app",
              type: "error",
              context: "local"
            });
          });
        }, 1000);
      }
    },
    {
      key: "documentation",
      icon: "user-sheet-docs",
      title: strings.documentation(),
      subtitle: "Tutorials & help center",
      onPress: async () => {
        Linking.openURL("https://docs.notesnook.com");
      }
    },
    {
      key: "logout",
      icon: "user-sheet-logout",
      title: strings.logout(),
      subtitle: "Sign out from this device",
      onPress: async () => {
        ref.current?.hide();
        await sleep(300);
        logoutUser();
      },
      hidden: !user
    }
  ];

  return (
    <View
      style={{
        width: "100%",
        justifyContent: "center",
        backgroundColor: colors.primary.background,
        paddingTop: Spacing.LEVEL_2,
        gap: Spacing.LEVEL_3
      }}
    >
      {user ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_2,
            width: "100%",
            paddingHorizontal: Spacing.LEVEL_3
          }}
        >
          {userProfile?.profilePicture ? (
            <Image
              source={{
                uri: userProfile?.profilePicture
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: Radius.XXL
              }}
            />
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: Radius.XXL,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary.background
              }}
            >
              <AppIcon
                name="account-outline"
                size={16}
                color={colors.secondary.icon}
              />
            </View>
          )}

          <View
            style={{
              flex: 1
            }}
          >
            <View style={{ gap: Spacing.LEVEL_1 }}>
              <Heading
                style={{
                  fontSize: AppFontSize.lg,
                  lineHeight: AppFontSize.lg
                }}
                fontFamily="MEDIUM"
                color={colors.primary.heading}
              >
                {userProfile?.fullName || strings.account()}
              </Heading>
              <Paragraph
                style={{
                  fontSize: AppFontSize.xs,
                  lineHeight: AppFontSize.xs
                }}
                color={colors.primary.paragraph}
              >
                {getObfuscatedEmail(user.email)}
              </Paragraph>
            </View>
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
              id: "log-in",
              type: "normal",
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

      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            borderBottomWidth: 1,
            height: 1,
            width: "100%",
            borderColor: colors.primary.border,
            marginVertical: 0
          }}
        />
      </View>

      <View style={{ gap: Spacing.LEVEL_0 }}>
        {actionItems.map((item) =>
          item.hidden ? null : (
            <Pressable
              key={item.key}
              style={{
                paddingVertical: Spacing.LEVEL_1,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "flex-start",
                gap: Spacing.LEVEL_2,
                paddingHorizontal: Spacing.LEVEL_3
              }}
              onPress={() => {
                item.onPress();
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: Radius.XS,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.secondary.background
                }}
              >
                <AppIcon
                  color={
                    item.key === "logout"
                      ? colors.static.red
                      : colors.primary.icon
                  }
                  iconFamily="notesnook"
                  name={item.icon}
                  size={16}
                />
              </View>

              <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
                <Heading
                  style={{
                    fontSize: AppFontSize.md,
                    lineHeight: AppFontSize.md
                  }}
                  fontFamily="SEMI_BOLD"
                >
                  {item.title}
                </Heading>

                <Paragraph
                  style={{
                    fontSize: AppFontSize.sm,
                    lineHeight: AppFontSize.sm
                  }}
                  color={colors.primary.paragraph}
                >
                  {item.key === "sync" && canShowLastSyncedTime ? (
                    <>
                      {item.subtitle}{" "}
                      <TimeSince
                        style={{
                          fontSize: AppFontSize.sm,
                          color: colors.primary.paragraph
                        }}
                        updateFrequency={30 * 1000}
                        time={lastSynced as number}
                      />
                    </>
                  ) : (
                    item.subtitle
                  )}
                </Paragraph>
              </View>
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
