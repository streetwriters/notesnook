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

import { getFeaturesTable } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
//@ts-ignore
import usePricingPlans from "../../hooks/use-pricing-plans";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { Steps } from "./common";

export const ComparePlans = React.memo(
  (props: {
    pricingPlans?: ReturnType<typeof usePricingPlans>;
    setStep: (step: number) => void;
  }) => {
    const { colors } = useThemeColors();
    const { width } = useWindowDimensions();
    const isTablet = width > 600;

    return (
      <ScrollView
        horizontal
        style={{
          width: isTablet ? "100%" : undefined
        }}
        contentContainerStyle={{
          flexDirection: "column"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            gap: 10
          }}
        >
          {["Features", "Free", "Essential", "Pro", "Believer"].map(
            (plan, index) => (
              <View
                key={plan}
                style={{
                  width: index === 0 ? 150 : 120,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor:
                    index === 0 ? colors.secondary.background : undefined,
                  borderBottomWidth: index === 0 ? 1 : undefined,
                  borderBottomColor: colors.primary.border
                }}
              >
                <Heading size={AppFontSize.sm}>{plan}</Heading>
              </View>
            )
          )}
        </View>

        {getFeaturesTable().map((item, keyIndex) => {
          return (
            <View
              key={`${item[0] + item[1]}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                gap: 10
              }}
            >
              {item.map((featureItem, index) => (
                <View
                  style={{
                    width: index === 0 ? 150 : 120,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor:
                      index === 0 ? colors.secondary.background : undefined,
                    borderBottomWidth: index === 0 ? 1 : undefined,
                    borderBottomColor: colors.primary.border
                  }}
                  key={item[0] + index}
                >
                  {typeof featureItem === "string" ? (
                    <Heading size={AppFontSize.sm}>
                      {featureItem as string}
                    </Heading>
                  ) : (
                    <>
                      {typeof featureItem.caption === "string" ||
                      typeof featureItem.caption === "number" ? (
                        <Paragraph>
                          {featureItem.caption === "infinity"
                            ? "∞"
                            : featureItem.caption}
                        </Paragraph>
                      ) : typeof featureItem.caption === "boolean" ? (
                        <>
                          {featureItem.caption === true ? (
                            <Icon
                              color={colors.primary.accent}
                              size={AppFontSize.sm}
                              name="check"
                            />
                          ) : (
                            <Icon
                              size={AppFontSize.sm}
                              color={colors.static.red}
                              name="close"
                            />
                          )}
                        </>
                      ) : null}
                    </>
                  )}
                </View>
              ))}
            </View>
          );
        })}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            gap: 10
          }}
        >
          {["features", "free", "essential", "pro", "believer"].map(
            (plan, index) => (
              <View
                key={plan + "btn"}
                style={{
                  width: index === 0 ? 150 : 120,
                  paddingHorizontal: 16,
                  paddingVertical: 8
                }}
              >
                {plan !== "free" && plan !== "features" ? (
                  <Button
                    title={strings.select()}
                    type="accent"
                    fontSize={AppFontSize.xs}
                    onPress={() => {
                      props.pricingPlans?.selectPlan(plan);
                      props.setStep(Steps.buy);
                    }}
                  />
                ) : null}
              </View>
            )
          )}
        </View>
      </ScrollView>
    );
  },
  () => true
);
ComparePlans.displayName = "ComparePlans";
