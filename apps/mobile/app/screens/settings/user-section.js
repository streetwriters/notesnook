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

import dayjs from "dayjs";
import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { TimeSince } from "../../components/ui/time-since";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
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

const SettingsUserSection = ({ item }) => {
  const colors = useThemeStore((state) => state.colors);
  const user = useUserStore((state) => state.user);
  const lastSynced = useUserStore((state) => state.lastSynced);

  return (
    <>
      {user ? (
        <>
          <View
            style={{
              paddingHorizontal: 12,
              marginTop: 15
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: "100%",
                paddingVertical: 12,
                backgroundColor: colors.bg,
                borderRadius: 5
              }}
            >
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  paddingBottom: 4
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "space-between"
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row"
                    }}
                  >
                    <View
                      style={{
                        alignItems: "center"
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: colors.shade,
                          borderRadius: 100,
                          width: 50,
                          height: 50,
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Icon
                          size={SIZE.xl}
                          color={colors.accent}
                          name="account-outline"
                        />
                      </View>
                    </View>

                    <View
                      style={{
                        marginLeft: 10,
                        flexGrow: 1
                      }}
                    >
                      <Heading color={colors.accent} size={SIZE.xs}>
                        {SUBSCRIPTION_STATUS_STRINGS[
                          user.subscription?.type
                        ]?.toUpperCase() || "Basic"}
                      </Heading>

                      <Paragraph color={colors.heading} size={SIZE.sm}>
                        {user?.email}
                      </Paragraph>
                      <Paragraph color={colors.icon} size={SIZE.xs}>
                        Last synced{" "}
                        <TimeSince
                          style={{ fontSize: SIZE.xs, color: colors.icon }}
                          time={lastSynced}
                        />
                      </Paragraph>
                    </View>
                  </View>
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
