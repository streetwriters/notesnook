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
import React, { useState } from "react";
import { ActivityIndicator, Platform, ScrollView, View } from "react-native";
import { LAUNCH_ROCKET } from "../../assets/images/assets";
import { db } from "../../common/database";
import { usePricing } from "../../hooks/use-pricing";
import { DDS } from "../../services/device-detection";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useUserStore } from "../../stores/use-user-store";
import { getElevationStyle } from "../../utils/elevation";
import { eClosePremiumDialog, eCloseSheet } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import { AuthMode } from "../auth/common";
import SheetProvider from "../sheet-provider";
import { Toast } from "../toast";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Seperator from "../ui/seperator";
import { SvgView } from "../ui/svg";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { Walkthrough } from "../walkthroughs";
import { features } from "./features";
import { Group } from "./group";
import { PricingPlans } from "./pricing-plans";

export const Component = ({ close, promo }) => {
  const { colors } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const userCanRequestTrial =
    user && (!user.subscription || !user.subscription.expiry) ? true : false;
  const [floatingButton, setFloatingButton] = useState(false);
  const pricing = usePricing("monthly");

  const onPress = async () => {
    if (user) {
      presentSheet({
        context: "pricing_plans",
        component: (
          <PricingPlans showTrialOption={false} marginTop={1} promo={promo} />
        )
      });
    } else {
      close();
      Navigation.navigate("Auth", {
        mode: AuthMode.trialSignup
      });
    }
  };

  const onScroll = (event) => {
    let contentSize = event.nativeEvent.contentSize.height;
    contentSize = contentSize - event.nativeEvent.layoutMeasurement.height;
    let yOffset = event.nativeEvent.contentOffset.y;
    if (yOffset > 600 && yOffset < contentSize - 400) {
      setFloatingButton(true);
    } else {
      setFloatingButton(false);
    }
  };

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        justifyContent: "space-between",
        borderRadius: 10,
        maxHeight: "100%"
      }}
    >
      <SheetProvider context="pricing_plans" />
      <IconButton
        onPress={() => {
          close();
        }}
        style={{
          position: "absolute",
          right: DDS.isTab ? 30 : 15,
          top: Platform.OS === "ios" ? 0 : 30,
          zIndex: 10,
          width: 50,
          height: 50
        }}
        color={colors.primary.paragraph}
        name="close"
      />

      <ScrollView
        style={{
          paddingHorizontal: DDS.isTab ? DDS.width / 5 : 0
        }}
        scrollEventThrottle={0}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
        onScroll={onScroll}
      >
        <View
          key="top-banner"
          style={{
            width: "100%",
            alignItems: "center",
            height: 400,
            justifyContent: "center"
          }}
        >
          <SvgView
            width={350}
            height={350}
            src={LAUNCH_ROCKET(colors.primary.accent)}
          />
        </View>

        <Heading
          key="heading"
          size={AppFontSize.lg}
          style={{
            alignSelf: "center",
            paddingTop: 20
          }}
        >
          Notesnook{" "}
          <Heading size={AppFontSize.lg} color={colors.primary.accent}>
            Pro
          </Heading>
        </Heading>

        {!pricing ? (
          <ActivityIndicator
            style={{
              marginBottom: 20
            }}
            size={AppFontSize.md}
            color={colors.primary.accent}
          />
        ) : (
          <Paragraph
            style={{
              alignSelf: "center",
              marginBottom: 20
            }}
            size={AppFontSize.md}
          >
            (
            {Platform.OS === "android"
              ? pricing.product?.subscriptionOfferDetails[0]?.pricingPhases
                  .pricingPhaseList?.[0].formattedPrice
              : pricing.product?.localizedPrice}{" "}
            / mo)
          </Paragraph>
        )}

        <Paragraph
          key="description"
          size={AppFontSize.md}
          style={{
            paddingHorizontal: 12,
            textAlign: "center",
            alignSelf: "center",
            paddingBottom: 20,
            width: "90%"
          }}
        >
          Ready to take the next step on your private note taking journey?
        </Paragraph>

        {userCanRequestTrial ? (
          <Button
            key="calltoaction"
            onPress={async () => {
              try {
                await db.user.activateTrial();
                eSendEvent(eClosePremiumDialog);
                eSendEvent(eCloseSheet);
                await sleep(300);
                Walkthrough.present("trialstarted", false, true);
              } catch (e) {
                console.error(e);
              }
            }}
            title="Try free for 14 days"
            type="accent"
            width={250}
            style={{
              paddingHorizontal: 12,
              marginBottom: 15,
              borderRadius: 100
            }}
          />
        ) : null}

        <Button
          key="calltoaction"
          onPress={onPress}
          title={
            promo ? promo.text : user ? "See all plans" : "Sign up for free"
          }
          type={userCanRequestTrial ? "secondaryAccented" : "accent"}
          width={250}
          style={{
            paddingHorizontal: 12,
            marginBottom: 15,
            borderRadius: 100
          }}
        />

        {!user || userCanRequestTrial ? (
          <Paragraph
            color={colors.secondary.paragraph}
            size={AppFontSize.xs}
            style={{
              alignSelf: "center",
              textAlign: "center",
              marginTop: 10,
              maxWidth: "80%"
            }}
          >
            {user
              ? 'On clicking "Try free for 14 days", your free trial will be activated.'
              : "After sign up you will be asked to activate your free trial."}{" "}
            <Paragraph size={AppFontSize.xs} style={{ fontWeight: "bold" }}>
              No credit card is required.
            </Paragraph>
          </Paragraph>
        ) : null}

        <Seperator key="seperator_1" />

        {features.map((item, index) => (
          <Group key={item.title} item={item} index={index} />
        ))}

        <View
          key="plans"
          style={{
            paddingHorizontal: 12
          }}
        >
          <PricingPlans showTrialOption={false} promo={promo} />
        </View>
      </ScrollView>

      {floatingButton ? (
        <Button
          onPress={onPress}
          title={
            promo ? promo.text : user ? "See all plans" : "Sign up for free"
          }
          type="accent"
          style={{
            paddingHorizontal: 24,
            position: "absolute",
            borderRadius: 100,
            bottom: 30,
            ...getElevationStyle(10)
          }}
        />
      ) : null}

      <Toast context="local" />
      <View
        style={{
          paddingBottom: 10
        }}
      />
    </View>
  );
};
