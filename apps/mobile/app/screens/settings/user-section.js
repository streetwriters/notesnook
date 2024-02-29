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
import dayjs from "dayjs";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { presentDialog } from "../../components/dialog/functions";
import AppIcon from "../../components/ui/AppIcon";
import { TimeSince } from "../../components/ui/time-since";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { useThemeStore } from "../../stores/use-theme-store";
import { SyncStatus, useUserStore } from "../../stores/use-user-store";
import { SUBSCRIPTION_STATUS_STRINGS } from "../../utils/constants";
import { SIZE } from "../../utils/size";
import { SectionItem } from "./section-item";

export const getTimeLeft = (t2) => {
  let daysRemaining = dayjs(t2).diff(dayjs(), "days");
  return {
    time: dayjs(t2).diff(dayjs(), daysRemaining === 0 ? "hours" : "days"),
    isHour: daysRemaining === 0
  };
};

const ProfilePicPlaceholder = () => {
  const { colors } = useThemeColors();
  return (
    <TouchableOpacity
      style={{
        alignItems: "center"
      }}
      activeOpacity={0.9}
      onPress={() => {
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
          cropperToolbarTitle: "Edit profile picture",
          cropperActiveWidgetColor: theme.scopes.base.primary.accent,
          cropperToolbarWidgetColor: theme.scopes.base.primary.icon
        }).then(async (image) => {
          if (!image.data) return;
          await db.user.setProfile({
            profilePicture: "data:image/jpeg;base64," + image.data
          });
          useUserStore.setState({
            profile: await db.user.getProfile()
          });
        });
      }}
    >
      <View
        style={{
          backgroundColor: colors.primary.shade,
          borderRadius: 100,
          width: 100,
          height: 100,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Icon size={50} color={colors.primary.accent} name="account-outline" />
      </View>
    </TouchableOpacity>
  );
};

const SettingsUserSection = ({ item }) => {
  const { colors } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const lastSynced = useUserStore((state) => state.lastSynced);
  const lastSyncStatus = useUserStore((state) => state.lastSyncStatus);
  const { isInternetReachable } = useNetInfo();
  const isOffline = !isInternetReachable;
  const userProfile = useUserStore((state) => state.profile);

  return (
    <>
      {user ? (
        <>
          <View
            style={{
              paddingHorizontal: 12,
              paddingTop: 50,
              borderBottomWidth: 1,
              paddingBottom: 20,
              borderColor: colors.secondary.background
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%"
              }}
            >
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%"
                }}
              >
                <View
                  style={{
                    borderWidth: 2,
                    borderRadius: 100,
                    marginBottom: 10,
                    borderColor: colors.primary.accent
                  }}
                >
                  {userProfile?.profilePicture ? (
                    <Image
                      source={{
                        uri: userProfile?.profilePicture
                      }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 100
                      }}
                    />
                  ) : (
                    <ProfilePicPlaceholder />
                  )}
                </View>

                <View
                  style={{
                    alignItems: "center"
                  }}
                >
                  <Heading color={colors.primary.accent} size={SIZE.sm}>
                    {SUBSCRIPTION_STATUS_STRINGS[
                      user.subscription?.type
                    ]?.toUpperCase() || "Basic"}
                  </Heading>

                  <Paragraph
                    onPress={() => {
                      presentDialog({
                        title: "Set name",
                        paragraph: "Set your full name",
                        positiveText: "Save",
                        input: true,
                        inputPlaceholder: "Enter your full name",
                        defaultValue: userProfile?.fullName,
                        positivePress: async (value) => {
                          db.user
                            .setProfile({
                              fullName: value
                            })
                            .then(async () => {
                              useUserStore.setState({
                                profile: await db.user.getProfile()
                              });
                            });
                        }
                      });
                    }}
                    color={colors.primary.heading}
                    size={SIZE.lg}
                  >
                    {userProfile?.fullName
                      ? userProfile.fullName + " "
                      : "Set your name "}
                    <AppIcon name="pencil" size={SIZE.lg} />
                  </Paragraph>

                  <Paragraph color={colors.primary.heading} size={SIZE.xs}>
                    {user?.email}
                  </Paragraph>

                  <Paragraph
                    style={{
                      flexWrap: "wrap",
                      marginTop: 5
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
