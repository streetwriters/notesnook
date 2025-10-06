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

import { formatBytes } from "@notesnook/common";
import { SubscriptionPlan, SubscriptionProvider } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import { useNetInfo } from "@react-native-community/netinfo";
import dayjs from "dayjs";
import React from "react";
import { Image, Platform, TouchableOpacity, View } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { presentDialog } from "../../components/dialog/functions";
import { PlanLimits } from "../../components/sheets/plan-limits";
import AppIcon from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/button";
import { TimeSince } from "../../components/ui/time-since";
import Paragraph from "../../components/ui/typography/paragraph";
import { presentSheet, ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import PremiumService from "../../services/premium";
import { useThemeStore } from "../../stores/use-theme-store";
import { SyncStatus, useUserStore } from "../../stores/use-user-store";
import { planToDisplayName } from "../../utils/constants";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { SectionItem } from "./section-item";
import SettingsService from "../../services/settings";

export const getTimeLeft = (t2) => {
  let daysRemaining = dayjs(t2).diff(dayjs(), "days");
  return {
    time: dayjs(t2).diff(dayjs(), daysRemaining === 0 ? "hours" : "days"),
    isHour: daysRemaining === 0
  };
};

const ProfilePicPlaceholder = (props) => {
  const { colors } = useThemeColors();
  return (
    <TouchableOpacity
      style={{
        alignItems: "center"
      }}
      activeOpacity={0.9}
      onPress={props?.onChangePicture}
    >
      <View
        style={{
          backgroundColor: colors.primary.shade,
          borderRadius: 100,
          width: 80,
          height: 80,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Icon size={35} color={colors.primary.accent} name="account-outline" />
      </View>
    </TouchableOpacity>
  );
};

const onChangePicture = () => {
  useUserStore.setState({
    disableAppLockRequests: true
  });
  const theme =
    useThemeStore.getState().colorScheme === "dark"
      ? useThemeStore.getState().darkTheme
      : useThemeStore.getState().lightTheme;

  ImagePicker.openPicker({
    compressImageMaxWidth: 256,
    compressImageMaxHeight: 256,
    compressImageQuality: 0.8,
    avoidEmptySpaceAroundImage: true,
    cropping: true,
    cropperCircleOverlay: true,
    mediaType: "photo",
    forceJpg: true,
    includeBase64: true,
    writeTempFile: false,
    cropperToolbarColor: theme.scopes.base.primary.background,
    cropperToolbarTitle: strings.editProfilePicture(),
    cropperActiveWidgetColor: theme.scopes.base.primary.accent,
    cropperToolbarWidgetColor: theme.scopes.base.primary.icon
  })
    .then(async (image) => {
      if (!image.data) return;
      await db.settings.setProfile({
        profilePicture: "data:image/jpeg;base64," + image.data
      });
      useUserStore.setState({
        profile: db.settings.getProfile()
      });
    })
    .finally(() => {
      setTimeout(() => {
        useUserStore.setState({
          disableAppLockRequests: false
        });
      }, 1000);
    });
};

const SettingsUserSection = ({ item }) => {
  const { colors } = useThemeColors();
  const [user] = useUserStore((state) => [state.user]);
  const lastSynced = useUserStore((state) => state.lastSynced);
  const lastSyncStatus = useUserStore((state) => state.lastSyncStatus);
  const { isInternetReachable } = useNetInfo();
  const isOffline = !isInternetReachable;
  const userProfile = useUserStore((state) => state.profile);
  const used = user?.storageUsed || 0;
  const total = user?.totalStorage || 0;

  const isCurrentPlatform =
    (user?.subscription?.provider === SubscriptionProvider.APPLE &&
      Platform.OS === "ios") ||
    (user?.subscription?.provider === SubscriptionProvider.GOOGLE &&
      Platform.OS === "android");

  return (
    <>
      {user ? (
        <>
          <View
            style={{
              paddingHorizontal: DefaultAppStyles.GAP,
              paddingTop: 25
            }}
          >
            <View
              style={{
                flexDirection: "row",
                width: "100%"
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  width: "100%",
                  gap: DefaultAppStyles.GAP,
                  alignItems: "center"
                }}
              >
                <View
                  style={{
                    borderRadius: 100,
                    alignSelf: "flex-start"
                  }}
                >
                  {userProfile?.profilePicture ? (
                    <TouchableOpacity
                      onPress={onChangePicture}
                      activeOpacity={1}
                    >
                      <Image
                        source={{
                          uri: userProfile?.profilePicture
                        }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 80
                        }}
                      />
                    </TouchableOpacity>
                  ) : (
                    <ProfilePicPlaceholder onChangePicture={onChangePicture} />
                  )}
                </View>

                <View>
                  <Paragraph
                    onPress={() => {
                      presentDialog({
                        title: strings.setFullName(),
                        paragraph: strings.setFullNameDesc(),
                        positiveText: strings.save(),
                        input: true,
                        inputPlaceholder: strings.enterFullName(),
                        defaultValue: userProfile?.fullName,
                        positivePress: async (value) => {
                          db.settings
                            .setProfile({
                              fullName: value
                            })
                            .then(async () => {
                              useUserStore.setState({
                                profile: db.settings.getProfile()
                              });
                            });
                        }
                      });
                    }}
                    color={colors.primary.heading}
                    size={AppFontSize.md}
                  >
                    {userProfile?.fullName
                      ? userProfile.fullName + " "
                      : strings.setYourName() + " "}
                    <AppIcon name="pencil" size={AppFontSize.md} />
                  </Paragraph>

                  <Paragraph
                    color={colors.primary.heading}
                    size={AppFontSize.xs}
                  >
                    {user?.email}
                  </Paragraph>

                  <Paragraph
                    style={{
                      flexWrap: "wrap"
                    }}
                    size={AppFontSize.xs}
                    color={colors.secondary.heading}
                  >
                    {!user ? (
                      strings.notLoggedIn()
                    ) : lastSynced && lastSynced !== "Never" ? (
                      <>
                        {lastSyncStatus === SyncStatus.Failed
                          ? strings.syncFailed()
                          : strings.synced()}{" "}
                        <TimeSince
                          style={{
                            fontSize: AppFontSize.xs,
                            color: colors.secondary.paragraph
                          }}
                          time={lastSynced}
                        />{" "}
                        ago
                        {isOffline ? ` (${strings.offline()})` : ""}
                      </>
                    ) : (
                      strings.never()
                    )}
                  </Paragraph>
                </View>
              </View>
            </View>

            <View
              style={{
                paddingVertical: DefaultAppStyles.GAP_SMALL,
                gap: DefaultAppStyles.GAP_VERTICAL,
                borderRadius: 10
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
                  <Paragraph size={AppFontSize.xxs}>
                    {strings.storage()}
                  </Paragraph>
                  <Paragraph size={AppFontSize.xxs}>
                    {formatBytes(used)}/
                    {total === -1
                      ? "Unlimited"
                      : formatBytes(total) + " " + strings.used()}
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
                      backgroundColor: colors.primary.accent,
                      height: 5,
                      width: `${(used / total) * 100}%`,
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
                  paddingHorizontal: DefaultAppStyles.GAP_SMALL,
                  borderRadius: 10
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => {
                    presentSheet({
                      component: <PlanLimits />
                    });
                  }}
                >
                  <Paragraph size={AppFontSize.sm}>
                    {planToDisplayName(user.subscription?.plan)}
                  </Paragraph>
                  <Paragraph
                    color={colors.secondary.paragraph}
                    size={AppFontSize.xxxs}
                  >
                    {strings.viewAllLimits()}{" "}
                    <AppIcon name="information" size={AppFontSize.xxxs} />
                  </Paragraph>
                </TouchableOpacity>

                {((user.subscription?.provider ===
                  SubscriptionProvider.PADDLE ||
                  user.subscription?.provider ===
                    SubscriptionProvider.STREETWRITERS ||
                  !isCurrentPlatform) &&
                  PremiumService.get()) ||
                SettingsService.getProperty("serverUrls") ? null : (
                  <Button
                    title={
                      user.subscription?.plan !== SubscriptionPlan.FREE
                        ? strings.changePlan()
                        : strings.upgradePlan()
                    }
                    onPress={() => {
                      if (
                        user?.subscription?.plan === SubscriptionPlan.LEGACY_PRO
                      ) {
                        ToastManager.show({
                          message: strings.cannotChangePlan(),
                          context: "local"
                        });
                        return;
                      }

                      if (
                        user.subscription?.plan !== SubscriptionPlan.FREE &&
                        user.subscription?.productId &&
                        user.subscription?.productId.includes("5year")
                      ) {
                        ToastManager.show({
                          message:
                            "You have made a one time purchase. To change your plan please contact support.",
                          type: "info"
                        });
                        return;
                      }

                      Navigation.navigate("PayWall", {
                        context: "logged-in",
                        canGoBack: true
                      });
                    }}
                    type="accent"
                    fontSize={AppFontSize.xs}
                    style={{
                      paddingHorizontal: DefaultAppStyles.GAP_SMALL,
                      height: "auto",
                      paddingVertical: DefaultAppStyles.GAP_SMALL
                    }}
                  />
                )}
              </View>
            </View>
          </View>

          {item.sections.map((item) => (
            <SectionItem key={item.name} item={item} />
          ))}
        </>
      ) : null}
    </>
  );
};

export default SettingsUserSection;
