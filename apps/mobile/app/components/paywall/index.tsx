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

import { EVENTS, Plan, SubscriptionPlan, User } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  NativeEventSubscription,
  ScrollView,
  useWindowDimensions,
  View
} from "react-native";
import Config from "react-native-config";
import * as RNIap from "react-native-iap";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ANDROID_POLICE_SVG,
  APPLE_INSIDER,
  FREEDOM_PRESS_SVG,
  NESS_LABS,
  PRIVACY_GUIDES_SVG,
  TECHLORE_SVG,
  THE_VERGE_SVG,
  XDA_SVG
} from "../../assets/images/assets";
import { db } from "../../common/database";
import { Radius, Spacing } from "../../common/design/spacing";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import usePricingPlans from "../../hooks/use-pricing-plans";
import Navigation, { NavigationProps } from "../../services/navigation";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { AuthMode } from "../auth/common";
import { BuyPlan } from "../sheets/buy-plan";
import { Toast } from "../toast";
import AppIcon from "../ui/AppIcon";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import { SvgView } from "../ui/svg";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { Steps } from "./common";
import { ComparePlans } from "./compare-plans";
import { FAQItem } from "./faq-item";
import { PricingPlanCard } from "./plan-card";
import { ReviewItem } from "./review-item";

const PRESS_LOGOS = (dark?: boolean) => [
  {
    id: "android-police",
    src: ANDROID_POLICE_SVG.replace(/white/g, dark ? "white" : "black"),
    width: 120,
    height: 14
  },
  {
    id: "the-verge",
    src: THE_VERGE_SVG.replace(/#F0F0F0/gi, dark ? "#F0F0F0" : "#111827"),
    width: 67,
    height: 14
  },
  {
    id: "freedom-press",
    src: FREEDOM_PRESS_SVG.replace(/white/g, dark ? "white" : "#1F2937"),
    width: 80,
    height: 12
  },
  {
    id: "privacy-guides",
    src: PRIVACY_GUIDES_SVG.replace(/white/g, dark ? "white" : "#1F2937"),
    width: 110,
    height: 16
  },
  {
    id: "techlore",
    src: TECHLORE_SVG.replace(/white/g, dark ? "white" : "#1F2937"),
    width: 72,
    height: 14
  },
  {
    id: "apple-insider",
    src: APPLE_INSIDER,
    width: 76,
    height: 13
  },
  {
    id: "xda",
    src: XDA_SVG.replace(/#C9C9C9/gi, dark ? "#C9C9C9" : "#4B5563"),
    width: 40,
    height: 12
  },
  {
    id: "ness-labs",
    src: NESS_LABS,
    width: 39,
    height: 23
  }
];

const PayWall = (props: NavigationProps<"PayWall">) => {
  const isGithubRelease = Config.GITHUB_RELEASE === "true";
  const routeParams = props.route.params;
  const { width } = useWindowDimensions();
  const [planPageIndex, setPlanPageIndex] = useState(1);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const isTablet = width > 600;
  const { colors, isDark } = useThemeColors();
  const pricingPlans = usePricingPlans({
    planId: routeParams.state?.planId,
    productId: routeParams.state?.productId,
    onBuy: () => {
      setStep(Steps.finish);
    }
  });
  const [annualBilling, setAnnualBilling] = useState(
    routeParams.state ? routeParams.state.billingType === "annual" : true
  );
  const [step, setStep] = useState(
    routeParams.state ? Steps.buy : Steps.select
  );
  const isFocused = useNavigationFocus(props.navigation, {
    onBlur: () => true,
    onFocus: () => true
  });

  useEffect(() => {
    if (routeParams.state) {
      if (routeParams.state?.planId) {
        pricingPlans.selectPlan(
          routeParams.state?.planId,
          routeParams.state?.productId
        );
      }
      setStep(Steps.buy);
    }
  }, [pricingPlans, routeParams.state]);

  useEffect(() => {
    let listener: NativeEventSubscription;
    if (isFocused) {
      listener = BackHandler.addEventListener("hardwareBackPress", () => {
        if (routeParams.context === "signup" && step === Steps.select)
          return true;
        if (step === Steps.buy) {
          setStep(Steps.select);
          return true;
        }
        return false;
      });
    }
    return () => {
      listener?.remove();
    };
  }, [isFocused, routeParams.context, step]);

  useEffect(() => {
    const sub = db.eventManager.subscribe(
      EVENTS.userSubscriptionUpdated,
      (sub: User["subscription"]) => {
        if (sub.plan === SubscriptionPlan.FREE) return;
        if (routeParams.context === "signup") {
          Navigation.navigate("FluidPanelsView", {});
        } else {
          Navigation.goBack();
        }
      }
    );
    return () => {
      sub?.unsubscribe();
    };
  }, [routeParams.context]);

  const is5YearPlanSelected = (
    isGithubRelease
      ? (pricingPlans.selectedProduct as Plan)?.period
      : (pricingPlans.selectedProduct as RNIap.Product)?.productId
  )?.includes("5");

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.primary.background,
        flex: 1
      }}
    >
      {step === Steps.finish ? null : routeParams.context === "signup" &&
        step === Steps.select ? (
        <View
          style={{
            height: 50,
            justifyContent: "flex-end",
            alignItems: "flex-end",
            flexDirection: "row",
            paddingHorizontal: DefaultAppStyles.GAP
          }}
        >
          <IconButton
            name="close"
            iconFamily="notesnook"
            testID="paywall-close"
            color={colors.primary.icon}
            size={18}
            onPress={() => {
              Navigation.navigate("FluidPanelsView", {});
            }}
          />
        </View>
      ) : (
        <View
          style={{
            height: 50,
            justifyContent: "space-between",
            flexDirection: "row",
            paddingHorizontal: DefaultAppStyles.GAP,
            width: "100%",
            alignItems: "center"
          }}
        >
          <IconButton
            name="arrow-back"
            iconFamily="notesnook"
            testID="paywall-close"
            color={colors.primary.icon}
            size={18}
            onPress={() => {
              if (step === Steps.buy && !routeParams.state) {
                setStep(Steps.select);
                return;
              }
              if (routeParams.context === "signup") {
                Navigation.navigate("FluidPanelsView", {});
              } else {
                Navigation.goBack();
              }
            }}
          />

          <Heading size={AppFontSize.xl}>
            {step === Steps.buy || step === Steps.buyWeb
              ? pricingPlans.userCanRequestTrial
                ? strings.tryPlanForFree(
                    pricingPlans.currentPlan?.name as string
                  )
                : strings.plan(pricingPlans.currentPlan?.name as string)
              : ""}
          </Heading>

          <View
            style={{
              width: 18,
              height: 18
            }}
          />
        </View>
      )}

      {step === Steps.select ? (
        <>
          <ScrollView
            style={{
              width: "100%"
            }}
            contentContainerStyle={{
              paddingBottom: 80
            }}
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
          >
            <View
              style={{
                borderBottomColor: colors.primary.border,
                gap: DefaultAppStyles.GAP_VERTICAL,
                paddingHorizontal: Spacing.LEVEL_3,
                paddingVertical: Spacing.LEVEL_4
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center"
                }}
              >
                <Heading key="heading" fontSize="XL" lineHeight="100%">
                  {pricingPlans.isSubscribed()
                    ? strings.changePlan()
                    : strings.notesnookPlans[0]() + " "}
                  {pricingPlans.isSubscribed()
                    ? null
                    : strings.notesnookPlans[1]()}
                </Heading>
              </View>

              <Paragraph key="description" fontSize="SM">
                {strings.readyToTakeNextStep()}
              </Paragraph>
            </View>

            <View>
              <View
                style={{
                  borderRadius: Radius.S,
                  borderWidth: 1,
                  borderColor: colors.primary.border,
                  backgroundColor: colors.secondary.background,
                  padding: Spacing.LEVEL_1,
                  flexDirection: "row",
                  gap: Spacing.LEVEL_1,
                  alignSelf: "center",
                  marginBottom: Spacing.LEVEL_3
                }}
              >
                <Button
                  onPress={() => {
                    setAnnualBilling(false);
                  }}
                  type={annualBilling ? "transparent" : "accent"}
                  textStyle={{
                    color: !annualBilling
                      ? colors.primary.accentForeground
                      : colors.secondary.paragraph
                  }}
                  style={{
                    width: 130,
                    paddingVertical: Spacing.LEVEL_2,
                    paddingHorizontal: Spacing.LEVEL_2,
                    borderWidth: 0
                  }}
                  title={strings.monthly()}
                />

                <Pressable
                  onPress={() => {
                    setAnnualBilling(true);
                  }}
                  style={{
                    width: 130,
                    flexDirection: "row",
                    paddingVertical: Spacing.LEVEL_1,
                    paddingHorizontal: Spacing.LEVEL_2,
                    gap: Spacing.LEVEL_1,
                    borderWidth: 0
                  }}
                  type={annualBilling ? "accent" : "transparent"}
                >
                  <Heading
                    fontFamily="SEMI_BOLD"
                    style={{
                      color: annualBilling
                        ? colors.primary.accentForeground
                        : colors.secondary.paragraph
                    }}
                    fontSize="MD"
                  >
                    {strings.yearly()}
                  </Heading>

                  <View
                    style={{
                      borderRadius: 100,
                      backgroundColor: colors.secondary.accent,
                      padding: Spacing.LEVEL_0
                    }}
                  >
                    <Paragraph color={colors.primary.accentForeground}>
                      -20%
                    </Paragraph>
                  </View>
                </Pressable>
              </View>

              <ScrollView
                style={{
                  flexDirection: "row"
                }}
                contentContainerStyle={{
                  gap: Spacing.LEVEL_3
                }}
                showsHorizontalScrollIndicator={false}
                horizontal
                pagingEnabled
                snapToOffsets={[310, 650]}
                onMomentumScrollEnd={(event) => {
                  const value = event.nativeEvent.contentOffset.x;
                  setPlanPageIndex(value > 600 ? 2 : value > 300 ? 1 : 0);
                }}
                contentOffset={{
                  x: 310,
                  y: 0
                }}
              >
                {pricingPlans.pricingPlans.map((plan, index) =>
                  plan.id !== "free" ? (
                    <View
                      key={plan.id}
                      style={{
                        width: 320,
                        marginLeft: index === 1 ? Spacing.LEVEL_3 : 0,
                        marginRight: index === 3 ? Spacing.LEVEL_3 : 0,
                        paddingVertical: Spacing.LEVEL_1
                      }}
                    >
                      <PricingPlanCard
                        plan={plan}
                        setStep={(step) => {
                          if (!pricingPlans.user) {
                            Navigation.navigate("Auth", {
                              mode: AuthMode.login,
                              state: {
                                planId: pricingPlans.currentPlan?.id,
                                productId:
                                  (
                                    pricingPlans.selectedProduct as RNIap.Subscription
                                  )?.productId ||
                                  (pricingPlans.selectedProduct as Plan)
                                    ?.period,
                                billingType: annualBilling
                                  ? "annual"
                                  : "monthly"
                              }
                            });
                            return;
                          }
                          setStep(step);
                        }}
                        pricingPlans={pricingPlans}
                        annualBilling={annualBilling}
                      />
                    </View>
                  ) : null
                )}
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  alignSelf: "center",
                  paddingTop: Spacing.LEVEL_4
                }}
              >
                {[0, 1, 2].map((item) => (
                  <View
                    key={"plan-index" + item}
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor:
                        planPageIndex === item
                          ? colors.primary.accent
                          : colors.primary.shade,
                      borderRadius: 100
                    }}
                  />
                ))}
              </View>
            </View>

            <View
              style={{
                width: "100%",
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: Spacing.LEVEL_1,
                paddingVertical: Spacing.LEVEL_7
              }}
            >
              {PRESS_LOGOS(isDark).map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: colors.secondary.background,
                    paddingVertical: Spacing.LEVEL_3,
                    paddingHorizontal: Spacing.LEVEL_2,
                    borderRadius: Radius.XS,
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 100
                  }}
                >
                  <SvgView
                    src={item.src}
                    style={{
                      width: item.width,
                      height: item.height
                    }}
                  />
                </View>
              ))}
            </View>

            <View>
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: Spacing.LEVEL_4
                }}
              >
                <Heading fontSize="XL">{strings.testimonials()}</Heading>
              </View>

              <ScrollView
                style={{
                  flexDirection: "row"
                }}
                contentContainerStyle={{
                  gap: Spacing.LEVEL_3
                }}
                showsHorizontalScrollIndicator={false}
                horizontal
                pagingEnabled
                snapToOffsets={[0, width - 50, width * 2 - 100]}
                onMomentumScrollEnd={(event) => {
                  const value = event.nativeEvent.contentOffset.x;
                  setTestimonialIndex(value > 600 ? 2 : value > 300 ? 1 : 0);
                }}
              >
                {[
                  {
                    user: "Tagby friend",
                    userSource: "Discord",
                    link: "https://discord.com/channels/796015620436787241/828701074465619990/1070172521846026271",
                    userImage:
                      "data:image/webp;base64,UklGRrAFAABXRUJQVlA4WAoAAAAQAAAATwAATwAAQUxQSAoAAAABB9D+iAhERP8DVlA4IIAFAAAQGACdASpQAFAAPm0skkYkIqGhL1K86IANiWdqN1k9SfbwDoK2qhJsXhBwv+m+3ujg5HTtBysrex6esj/qeU5883L4Rbay65pvw7npaa0yc/fmrdXlgwv8WNtJN9J5m8XMkAKD7lrd98bFKn2UcICVz6fIlJpW6gQDx3Y/lQzupEnm4fyWa/VI47NFSGLJjPe4K/NR5nIh1I+JaGqh5h6Zn/9771gyWEnxRaaHU7LdnMvNnAtVXhm3Ijxrv+9TKC7rtKa+oqC2ewAA/v17lyxCQMDU8AW7okR5UCCzmkNNZqVrX1NJ2Mu1LrM2qc+DCezUOb2Y8MzxK5xRgGrcR0/FAx88Y1KeuT5RUbhRcNNnTw1Un3MWtOlBIXpYjntwwdRskDymt47ZvkH+V5QANy6cAr+Lrol9EOVUxXc8G5bTJLcIHELmBulybx2w+O+btTXtlkgn0JSy0pAWMfZunaztVCHoyNnmWxhHAFMMUSycgx76ovzc8+Hwd/rRUY3/P+B4/y3dQZ9FB+vMiyYCEdci0l8arhH6f0IOVijOkAXiuS8KfnOh76NP5jbRF0qvz63DDZSUmpsXJGnI7phYFgJ5Em+3zIebcKqPcn4M5hznAH9mYIPsv8jeOCg7+DRYljkh4AbTxImyoRrPy9GUeUA1QC290cK+877ce6yyNzQK8jaLEAz53ccPZj/cHk17B2SCVknKQhV7bz6yg6fLGR5AT3qAPfdQsVeHrPLQdRZmw1ll62E7lCU7+WCuHk+xAg1JwiyZsdWlcSf1Oazs7qgdnon9lQNVKgzGSR+I811YKPAS5U3go9ANCZwqsmdQ07Y+ZzCuLukH46D0tWk/kBVgXBzMhOf8bAlayYfIGvIdEXjm6Z4j0SIz3juiY35mCjXXwez84ESBpc3z0c2gWgRFzWx/iyYBjPzJ5s3Mub6xzfsWtYqAmhAPzeoK5pJWgiB6tEyI2oZmLuj7sLVHARnaswrfzDlIUMPXRSZFoq+mmsIF1aKThJDQTNdgnkLjfz3rDkVaqVhk3sg8jZLIOMJUKsYvujEmGRbRlO3hwfL0JvoORLh8rOJ0prBA2Tnra+VA/RMfJtKC/AjVXRu/nH0tmGg2/Wkra7C/OWK9E2NqBVVjJvrgqvNN0V8gYZdScIl0jQSLRzA4emm2HfC+L8c4FCxheZFDMP+zGUH5JyXLkBX/hGWE+CWhcPjSJ8hAj8yBeXCyWpM07eiFPxxkqYF+Wka211fUU/HygHPX+Qj+CyoMjz9gstrjNPTX0zc3r55VrpiFUjxfgOoY32Eojwr9mWg/dcleov8wSmKuJZtzjxiXFzemVIP5kzrDIffxS6PR30mOq+d9k/ZgJfzhyuPr6W8kOmQXmLnMwbpcr1KSSgjOLmu6oBtjexL/ukI77ygGzDtdDfRPpj7klVHu34xcWAufMWOMlo70oenOeQGueYXGWPZW175I30dvCT/Ra2R+0MbxvxmdpmmoQmzC4d7l/MI2MhUHUW5N79x0vXB1PEGs+F3o+6dO+N1qqqXxJP/0N5BvADUF55dX2vpBSAXyN30UPO9IBqC0JkFPwXiOncsUir6r50C47HnS2WadAlu2QpHFL8YrTsSdhP19HAc6zWDM2/RaJZxFFQj/tqw0rYVYX//7iKKSiXWWQma12fG+HhJD2tBjEcp8+vU2nzjmd4tR6AurIEns1SsWg2cFcvrZzyzKFB0gdnvVpoCwouvl8UuSAyYc+rHMVGhWln+a+bhRgIERIb5XlrazMxJOqksed7mUs5ArKpOEuHWPYu+U+E2T1OkeusgAKL57F73Fm2xbIunW/IbW2wawYHv8u1AWGGSAB8XYJOW1XxpqIgq+V34pqd3WRpBGd1G4rGAA",
                    review: `I just want to say thank you so much.

After trying all the privacy security oriented note taking apps, for the price and the features afforded to your users, Notesnook is hands down the best.`
                  },
                  {
                    user: "Tagby frien",
                    userSource: "Discord",
                    link: "https://discord.com/channels/796015620436787241/828701074465619990/1070172521846026271",
                    userImage:
                      "data:image/webp;base64,UklGRrAFAABXRUJQVlA4WAoAAAAQAAAATwAATwAAQUxQSAoAAAABB9D+iAhERP8DVlA4IIAFAAAQGACdASpQAFAAPm0skkYkIqGhL1K86IANiWdqN1k9SfbwDoK2qhJsXhBwv+m+3ujg5HTtBysrex6esj/qeU5883L4Rbay65pvw7npaa0yc/fmrdXlgwv8WNtJN9J5m8XMkAKD7lrd98bFKn2UcICVz6fIlJpW6gQDx3Y/lQzupEnm4fyWa/VI47NFSGLJjPe4K/NR5nIh1I+JaGqh5h6Zn/9771gyWEnxRaaHU7LdnMvNnAtVXhm3Ijxrv+9TKC7rtKa+oqC2ewAA/v17lyxCQMDU8AW7okR5UCCzmkNNZqVrX1NJ2Mu1LrM2qc+DCezUOb2Y8MzxK5xRgGrcR0/FAx88Y1KeuT5RUbhRcNNnTw1Un3MWtOlBIXpYjntwwdRskDymt47ZvkH+V5QANy6cAr+Lrol9EOVUxXc8G5bTJLcIHELmBulybx2w+O+btTXtlkgn0JSy0pAWMfZunaztVCHoyNnmWxhHAFMMUSycgx76ovzc8+Hwd/rRUY3/P+B4/y3dQZ9FB+vMiyYCEdci0l8arhH6f0IOVijOkAXiuS8KfnOh76NP5jbRF0qvz63DDZSUmpsXJGnI7phYFgJ5Em+3zIebcKqPcn4M5hznAH9mYIPsv8jeOCg7+DRYljkh4AbTxImyoRrPy9GUeUA1QC290cK+877ce6yyNzQK8jaLEAz53ccPZj/cHk17B2SCVknKQhV7bz6yg6fLGR5AT3qAPfdQsVeHrPLQdRZmw1ll62E7lCU7+WCuHk+xAg1JwiyZsdWlcSf1Oazs7qgdnon9lQNVKgzGSR+I811YKPAS5U3go9ANCZwqsmdQ07Y+ZzCuLukH46D0tWk/kBVgXBzMhOf8bAlayYfIGvIdEXjm6Z4j0SIz3juiY35mCjXXwez84ESBpc3z0c2gWgRFzWx/iyYBjPzJ5s3Mub6xzfsWtYqAmhAPzeoK5pJWgiB6tEyI2oZmLuj7sLVHARnaswrfzDlIUMPXRSZFoq+mmsIF1aKThJDQTNdgnkLjfz3rDkVaqVhk3sg8jZLIOMJUKsYvujEmGRbRlO3hwfL0JvoORLh8rOJ0prBA2Tnra+VA/RMfJtKC/AjVXRu/nH0tmGg2/Wkra7C/OWK9E2NqBVVjJvrgqvNN0V8gYZdScIl0jQSLRzA4emm2HfC+L8c4FCxheZFDMP+zGUH5JyXLkBX/hGWE+CWhcPjSJ8hAj8yBeXCyWpM07eiFPxxkqYF+Wka211fUU/HygHPX+Qj+CyoMjz9gstrjNPTX0zc3r55VrpiFUjxfgOoY32Eojwr9mWg/dcleov8wSmKuJZtzjxiXFzemVIP5kzrDIffxS6PR30mOq+d9k/ZgJfzhyuPr6W8kOmQXmLnMwbpcr1KSSgjOLmu6oBtjexL/ukI77ygGzDtdDfRPpj7klVHu34xcWAufMWOMlo70oenOeQGueYXGWPZW175I30dvCT/Ra2R+0MbxvxmdpmmoQmzC4d7l/MI2MhUHUW5N79x0vXB1PEGs+F3o+6dO+N1qqqXxJP/0N5BvADUF55dX2vpBSAXyN30UPO9IBqC0JkFPwXiOncsUir6r50C47HnS2WadAlu2QpHFL8YrTsSdhP19HAc6zWDM2/RaJZxFFQj/tqw0rYVYX//7iKKSiXWWQma12fG+HhJD2tBjEcp8+vU2nzjmd4tR6AurIEns1SsWg2cFcvrZzyzKFB0gdnvVpoCwouvl8UuSAyYc+rHMVGhWln+a+bhRgIERIb5XlrazMxJOqksed7mUs5ArKpOEuHWPYu+U+E2T1OkeusgAKL57F73Fm2xbIunW/IbW2wawYHv8u1AWGGSAB8XYJOW1XxpqIgq+V34pqd3WRpBGd1G4rGAA",
                    review: `I just want to say thank you so much.

After trying all the privacy security oriented note taking apps, for the price and the features afforded to your users, Notesnook is hands down the best.`
                  },
                  {
                    user: "Tagby frie",
                    userSource: "Discord",
                    link: "https://discord.com/channels/796015620436787241/828701074465619990/1070172521846026271",
                    userImage:
                      "data:image/webp;base64,UklGRrAFAABXRUJQVlA4WAoAAAAQAAAATwAATwAAQUxQSAoAAAABB9D+iAhERP8DVlA4IIAFAAAQGACdASpQAFAAPm0skkYkIqGhL1K86IANiWdqN1k9SfbwDoK2qhJsXhBwv+m+3ujg5HTtBysrex6esj/qeU5883L4Rbay65pvw7npaa0yc/fmrdXlgwv8WNtJN9J5m8XMkAKD7lrd98bFKn2UcICVz6fIlJpW6gQDx3Y/lQzupEnm4fyWa/VI47NFSGLJjPe4K/NR5nIh1I+JaGqh5h6Zn/9771gyWEnxRaaHU7LdnMvNnAtVXhm3Ijxrv+9TKC7rtKa+oqC2ewAA/v17lyxCQMDU8AW7okR5UCCzmkNNZqVrX1NJ2Mu1LrM2qc+DCezUOb2Y8MzxK5xRgGrcR0/FAx88Y1KeuT5RUbhRcNNnTw1Un3MWtOlBIXpYjntwwdRskDymt47ZvkH+V5QANy6cAr+Lrol9EOVUxXc8G5bTJLcIHELmBulybx2w+O+btTXtlkgn0JSy0pAWMfZunaztVCHoyNnmWxhHAFMMUSycgx76ovzc8+Hwd/rRUY3/P+B4/y3dQZ9FB+vMiyYCEdci0l8arhH6f0IOVijOkAXiuS8KfnOh76NP5jbRF0qvz63DDZSUmpsXJGnI7phYFgJ5Em+3zIebcKqPcn4M5hznAH9mYIPsv8jeOCg7+DRYljkh4AbTxImyoRrPy9GUeUA1QC290cK+877ce6yyNzQK8jaLEAz53ccPZj/cHk17B2SCVknKQhV7bz6yg6fLGR5AT3qAPfdQsVeHrPLQdRZmw1ll62E7lCU7+WCuHk+xAg1JwiyZsdWlcSf1Oazs7qgdnon9lQNVKgzGSR+I811YKPAS5U3go9ANCZwqsmdQ07Y+ZzCuLukH46D0tWk/kBVgXBzMhOf8bAlayYfIGvIdEXjm6Z4j0SIz3juiY35mCjXXwez84ESBpc3z0c2gWgRFzWx/iyYBjPzJ5s3Mub6xzfsWtYqAmhAPzeoK5pJWgiB6tEyI2oZmLuj7sLVHARnaswrfzDlIUMPXRSZFoq+mmsIF1aKThJDQTNdgnkLjfz3rDkVaqVhk3sg8jZLIOMJUKsYvujEmGRbRlO3hwfL0JvoORLh8rOJ0prBA2Tnra+VA/RMfJtKC/AjVXRu/nH0tmGg2/Wkra7C/OWK9E2NqBVVjJvrgqvNN0V8gYZdScIl0jQSLRzA4emm2HfC+L8c4FCxheZFDMP+zGUH5JyXLkBX/hGWE+CWhcPjSJ8hAj8yBeXCyWpM07eiFPxxkqYF+Wka211fUU/HygHPX+Qj+CyoMjz9gstrjNPTX0zc3r55VrpiFUjxfgOoY32Eojwr9mWg/dcleov8wSmKuJZtzjxiXFzemVIP5kzrDIffxS6PR30mOq+d9k/ZgJfzhyuPr6W8kOmQXmLnMwbpcr1KSSgjOLmu6oBtjexL/ukI77ygGzDtdDfRPpj7klVHu34xcWAufMWOMlo70oenOeQGueYXGWPZW175I30dvCT/Ra2R+0MbxvxmdpmmoQmzC4d7l/MI2MhUHUW5N79x0vXB1PEGs+F3o+6dO+N1qqqXxJP/0N5BvADUF55dX2vpBSAXyN30UPO9IBqC0JkFPwXiOncsUir6r50C47HnS2WadAlu2QpHFL8YrTsSdhP19HAc6zWDM2/RaJZxFFQj/tqw0rYVYX//7iKKSiXWWQma12fG+HhJD2tBjEcp8+vU2nzjmd4tR6AurIEns1SsWg2cFcvrZzyzKFB0gdnvVpoCwouvl8UuSAyYc+rHMVGhWln+a+bhRgIERIb5XlrazMxJOqksed7mUs5ArKpOEuHWPYu+U+E2T1OkeusgAKL57F73Fm2xbIunW/IbW2wawYHv8u1AWGGSAB8XYJOW1XxpqIgq+V34pqd3WRpBGd1G4rGAA",
                    review: `I just want to say thank you so much.

After trying all the privacy security oriented note taking apps, for the price and the features afforded to your users, Notesnook is hands down the best.`
                  }
                ].map((item, index) => (
                  <View
                    key={item.user}
                    style={{
                      width: width - 50,
                      paddingLeft: index === 0 ? Spacing.LEVEL_3 : 0,
                      paddingRight: index === 2 ? Spacing.LEVEL_3 : 0
                    }}
                  >
                    <ReviewItem
                      user={item.user}
                      userSource={item.userSource}
                      link={item.link}
                      userImage={item.userImage}
                      review={item.review}
                    />
                  </View>
                ))}
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  gap: 6,
                  alignSelf: "center",
                  paddingTop: Spacing.LEVEL_4
                }}
              >
                {[0, 1, 2].map((item) => (
                  <View
                    key={"testimonial-index" + item}
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor:
                        testimonialIndex === item
                          ? colors.primary.accent
                          : colors.primary.shade,
                      borderRadius: 100
                    }}
                  />
                ))}
              </View>
            </View>

            <View
              style={{
                alignItems: "center",
                paddingVertical: Spacing.LEVEL_4
              }}
            >
              <Heading fontSize="XL" lineHeight={null}>
                {strings.frequentlyAskedQuestions()}
              </Heading>
            </View>

            <View
              style={{
                paddingHorizontal: Spacing.LEVEL_3
              }}
            >
              {strings.checkoutFaqs.map((item) => (
                <FAQItem
                  key={item.question()}
                  question={item.question()}
                  answer={item.answer()}
                />
              ))}
            </View>

            <View
              style={{
                alignItems: "center",
                paddingVertical: Spacing.LEVEL_4
              }}
            >
              <Heading fontSize="XL">{strings.comparePlans()}</Heading>
            </View>

            <View
              style={{
                alignSelf: isTablet ? "center" : "flex-start",
                flexShrink: 1
              }}
            >
              <ComparePlans pricingPlans={pricingPlans} setStep={setStep} />
            </View>
          </ScrollView>
        </>
      ) : step === Steps.buy ? (
        <BuyPlan
          planId={pricingPlans.currentPlan?.id as string}
          canActivateTrial={pricingPlans.userCanRequestTrial}
          pricingPlans={pricingPlans}
        />
      ) : step === Steps.finish ? (
        <View
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            gap: DefaultAppStyles.GAP_VERTICAL,
            maxWidth: "80%",
            alignSelf: "center"
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 200,
              backgroundColor: colors.primary.shade,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <AppIcon color={colors.primary.accent} name="check" size={30} />
          </View>
          <Heading>
            {is5YearPlanSelected
              ? strings.thankYouForPurchase()
              : strings.thankYouForSubscribing()}
          </Heading>
          <Paragraph
            style={{
              textAlign: "center"
            }}
          >
            {strings.settingUpPlan()}
          </Paragraph>

          <Button
            title={strings.continue()}
            type="accent"
            onPress={() => {
              if (routeParams.context === "signup") {
                Navigation.navigate("FluidPanelsView", {});
              } else {
                Navigation.goBack();
              }
            }}
          />
        </View>
      ) : null}

      <Toast context="local" />
    </SafeAreaView>
  );
};

export default PayWall;
