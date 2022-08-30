/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
  // const subscriptionDaysLeft =
  //   user && getTimeLeft(parseInt(user.subscription?.expiry));
  // const isExpired = user && subscriptionDaysLeft.time < 0;
  // const expiryDate = dayjs(user?.subscription?.expiry).format('MMMM D, YYYY');
  // const startDate = dayjs(user?.subscription?.start).format('MMMM D, YYYY');
  // const monthlyPlan = usePricing('monthly');
  // const isBasic = user?.subscription?.type === SUBSCRIPTION_STATUS.BASIC;
  // const isTrial = user?.subscription?.type === SUBSCRIPTION_STATUS.TRIAL;
  // const isPro = user?.subscription?.type === SUBSCRIPTION_STATUS.PREMIUM;
  // const isNotPro =
  //   user?.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM &&
  //   user?.subscription?.type !== SUBSCRIPTION_STATUS.BETA;

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
                      <Heading color={colors.accent} size={SIZE.xs + 1}>
                        {SUBSCRIPTION_STATUS_STRINGS[
                          user.subscription?.type
                        ].toUpperCase()}
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

              {/* {isNotPro ? (
                <Button
                  height={30}
                  style={{
                    borderRadius: 100,
                    paddingHorizontal: 12
                  }}
                  fontSize={SIZE.xs}
                  type="accent"
                  title={`GET PRO (${monthlyPlan?.product?.localizedPrice} / mo)`}
                />
              ) : null} */}

              {/* <View>
                {user.subscription?.type !== SUBSCRIPTION_STATUS.BASIC ? (
                  <View>
                    <Seperator />
                    <Paragraph
                      size={SIZE.lg}
                      style={{
                        textAlign: 'center'
                      }}
                      color={
                        (subscriptionDaysLeft.time > 5 && !subscriptionDaysLeft.isHour) ||
                        user.subscription?.type !== 6
                          ? colors.accent
                          : colors.red
                      }
                    >
                      {isExpired
                        ? 'Your subscription has ended.'
                        : user.subscription?.type === 1
                        ? `Your free trial has started`
                        : `Subscribed to Notesnook Pro`}
                    </Paragraph>
                    <Paragraph
                      style={{
                        textAlign: 'center'
                      }}
                      color={colors.pri}
                    >
                      {user.subscription?.type === 2
                        ? 'You signed up on ' + startDate
                        : user.subscription?.type === 1
                        ? 'Your free trial will end on ' + expiryDate
                        : user.subscription?.type === 6
                        ? subscriptionDaysLeft.time < -3
                          ? 'Your subscription has ended'
                          : 'Your account will be downgraded to Basic in 3 days'
                        : user.subscription?.type === 7
                        ? `Your subscription will end on ${expiryDate}.`
                        : user.subscription?.type === 5
                        ? `Your subscription will renew on ${expiryDate}.`
                        : null}
                    </Paragraph>
                  </View>
                ) : null}
              </View> */}

              {/* {user?.subscription?.provider &&
              user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM_EXPIRED &&
              user.subscription?.type !== SUBSCRIPTION_STATUS.BASIC &&
              SUBSCRIPTION_PROVIDER[user?.subscription?.provider] ? (
                <Button
                  title={SUBSCRIPTION_PROVIDER[user?.subscription?.provider]?.title}
                  onPress={() => {
                    presentSheet({
                      title: SUBSCRIPTION_PROVIDER[user?.subscription?.provider].title,
                      paragraph: SUBSCRIPTION_PROVIDER[user?.subscription?.provider].desc
                    });
                  }}
                  style={{
                    alignSelf: 'flex-end',
                    marginTop: 10,
                    borderRadius: 3,
                    zIndex: 10
                  }}
                  fontSize={11}
                  textStyle={{
                    fontWeight: 'normal'
                  }}
                  height={20}
                  type="accent"
                />
              ) : null} */}
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
