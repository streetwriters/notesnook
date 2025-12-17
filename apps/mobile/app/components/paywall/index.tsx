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
import {
  EV,
  EVENTS,
  Plan,
  SKUResponse,
  SubscriptionPlan,
  User
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  NativeEventSubscription,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import Config from "react-native-config";
import * as RNIap from "react-native-iap";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
//@ts-ignore
import ToggleSwitch from "toggle-switch-react-native";
import {
  ANDROID_POLICE_SVG,
  APPLE_INSIDER_PNG,
  ITS_FOSS_NEWS_PNG,
  NESS_LABS_PNG,
  PRIVACY_GUIDES_SVG,
  TECHLORE_SVG,
  XDA_SVG
} from "../../assets/images/assets";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import usePricingPlans, {
  PlanOverView,
  PricingPlan
} from "../../hooks/use-pricing-plans";
import Navigation, { NavigationProps } from "../../services/navigation";
import PremiumService from "../../services/premium";
import { getElevationStyle } from "../../utils/elevation";
import { openLinkInBrowser } from "../../utils/functions";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { AuthMode } from "../auth/common";
import { Header } from "../header";
import { BuyPlan } from "../sheets/buy-plan";
import { Toast } from "../toast";
import AppIcon from "../ui/AppIcon";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { SvgView } from "../ui/svg";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

const Steps = {
  select: 1,
  buy: 2,
  finish: 3,
  buyWeb: 4
};

const PayWall = (props: NavigationProps<"PayWall">) => {
  const isGithubRelease = Config.GITHUB_RELEASE === "true";
  const routeParams = props.route.params;
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const { colors } = useThemeColors();
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
  }, [routeParams.state]);

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
  }, [isFocused, step]);

  useEffect(() => {
    const sub = EV.subscribe(
      EVENTS.userSubscriptionUpdated,
      (sub: User["subscription"]) => {
        if (sub.plan === SubscriptionPlan.FREE) return;
        if (routeParams.context === "signup") {
          Navigation.replace("FluidPanelsView", {});
        } else {
          Navigation.goBack();
        }
      }
    );
    return () => {
      sub?.unsubscribe();
    };
  }, []);

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
            width: "100%",
            flexDirection: "row",
            paddingHorizontal: DefaultAppStyles.GAP
          }}
        >
          <IconButton
            name="close"
            onPress={() => {
              Navigation.replace("FluidPanelsView", {});
            }}
          />
        </View>
      ) : (
        <Header
          canGoBack={true}
          onLeftMenuButtonPress={() => {
            if (step === Steps.buy) {
              setStep(Steps.select);
              return;
            }
            if (routeParams.context === "signup") {
              Navigation.replace("FluidPanelsView", {});
            } else {
              Navigation.goBack();
            }
          }}
          title={
            step === Steps.buy || step === Steps.buyWeb
              ? pricingPlans.userCanRequestTrial
                ? strings.tryPlanForFree(
                    pricingPlans.currentPlan?.name as string
                  )
                : strings.plan(pricingPlans.currentPlan?.name as string)
              : ""
          }
        />
      )}

      {step === Steps.select ? (
        <>
          <ScrollView
            style={{
              width: "100%"
            }}
            contentContainerStyle={{
              gap: DefaultAppStyles.GAP_VERTICAL,
              paddingBottom: 80
            }}
            keyboardDismissMode="none"
            keyboardShouldPersistTaps="always"
          >
            <View
              style={{
                paddingTop: 100,
                borderBottomColor: colors.primary.border,
                borderBottomWidth: 1,
                paddingHorizontal: DefaultAppStyles.GAP,
                paddingBottom: 25,
                gap: DefaultAppStyles.GAP_VERTICAL
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <Heading
                  key="heading"
                  size={AppFontSize.xl}
                  style={{
                    alignSelf: "center"
                  }}
                >
                  {pricingPlans.isSubscribed()
                    ? strings.changePlan()
                    : strings.notesnookPlans[0]() + " "}
                  {pricingPlans.isSubscribed() ? null : (
                    <Heading
                      size={AppFontSize.xl}
                      color={colors.primary.accent}
                    >
                      {strings.notesnookPlans[1]()}
                    </Heading>
                  )}
                </Heading>
              </View>

              <Paragraph key="description" size={AppFontSize.md}>
                {strings.readyToTakeNextStep()}
              </Paragraph>
            </View>

            <View
              style={{
                gap: DefaultAppStyles.GAP_VERTICAL,
                paddingHorizontal: DefaultAppStyles.GAP
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setAnnualBilling((state) => !state);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 15,
                  width: "100%",
                  justifyContent: "center",
                  paddingVertical: 12
                }}
                activeOpacity={0.9}
              >
                <Paragraph>{strings.monthly()}</Paragraph>
                <ToggleSwitch
                  isOn={annualBilling}
                  onColor={colors.primary.accent}
                  offColor={colors.secondary.accent}
                  size="small"
                  animationSpeed={150}
                  onToggle={() => {
                    setAnnualBilling((state) => !state);
                  }}
                />
                <Paragraph>
                  {strings.yearly()}{" "}
                  <Paragraph color={colors.primary.accent}>
                    ({strings.percentOff("15")})
                  </Paragraph>
                </Paragraph>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: isTablet ? "row" : "column",
                  gap: !isTablet ? DefaultAppStyles.GAP : 0
                }}
              >
                {pricingPlans.pricingPlans.map((plan) =>
                  plan.id !== "free" ? (
                    <PricingPlanCard
                      key={plan.id}
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
                                (pricingPlans.selectedProduct as Plan)?.period,
                              billingType: annualBilling ? "annual" : "monthly"
                            }
                          });
                          return;
                        }
                        setStep(step);
                      }}
                      pricingPlans={pricingPlans}
                      annualBilling={annualBilling}
                    />
                  ) : null
                )}
              </View>
            </View>

            <View
              style={{
                width: "100%"
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  alignItems: "center",
                  flexShrink: 1
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    openLinkInBrowser(
                      "https://github.com/streetwriters/notesnook"
                    );
                  }}
                  activeOpacity={0.9}
                  style={{
                    padding: 16,
                    gap: 12,
                    alignItems: "center",
                    flexGrow: 1
                  }}
                >
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      width: 50,
                      height: 50,
                      backgroundColor: "black",
                      borderRadius: 10
                    }}
                  >
                    <Icon
                      size={40}
                      name="open-source-initiative"
                      color={colors.static.white}
                    />
                  </View>
                  <Paragraph
                    style={{
                      flexShrink: 1
                    }}
                    size={AppFontSize.md}
                  >
                    Open Source
                  </Paragraph>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    openLinkInBrowser(
                      "https://github.com/streetwriters/notesnook/stargazers"
                    );
                  }}
                  activeOpacity={0.9}
                  style={{
                    padding: 16,
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    flexGrow: 1
                  }}
                >
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      width: 50,
                      height: 50,
                      backgroundColor: "black",
                      borderRadius: 10
                    }}
                  >
                    <Icon size={40} name="github" color={colors.static.white} />
                  </View>
                  <Paragraph
                    style={{
                      flexShrink: 1
                    }}
                    size={AppFontSize.md}
                  >
                    12.5K stars
                  </Paragraph>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    openLinkInBrowser(
                      "https://www.privacyguides.org/en/notebooks/#notesnook"
                    );
                  }}
                  activeOpacity={0.9}
                  style={{
                    justifyContent: "center",
                    padding: 16,
                    gap: 12,
                    alignItems: "center",
                    flexGrow: 1
                  }}
                >
                  <SvgView width={60} height={60} src={PRIVACY_GUIDES_SVG} />
                  <Paragraph
                    style={{
                      flexShrink: 1,
                      maxWidth: 300,
                      textAlign: "center"
                    }}
                    size={AppFontSize.md}
                  >
                    {strings.recommendedByPrivacyGuides()}
                  </Paragraph>
                </TouchableOpacity>
              </View>

              <Heading
                style={{
                  marginBottom: 20,
                  alignSelf: "center"
                }}
              >
                {strings.featuredOn()}
              </Heading>

              <View
                style={{
                  width: "100%",
                  paddingHorizontal: 16,
                  alignItems: "center",
                  paddingBottom: 16,
                  flexDirection: "row",
                  gap: 20,
                  flexWrap: "wrap",
                  justifyContent: "center"
                }}
              >
                <Image
                  source={{
                    uri: NESS_LABS_PNG
                  }}
                  style={{
                    width: 100,
                    height: 80
                  }}
                />

                <Image
                  source={{
                    uri: ITS_FOSS_NEWS_PNG
                  }}
                  resizeMode="contain"
                  style={{
                    width: 150,
                    height: 100
                  }}
                />

                <Image
                  source={{
                    uri: APPLE_INSIDER_PNG
                  }}
                  resizeMode="contain"
                  style={{
                    width: 368 * 0.5,
                    height: 100
                  }}
                />

                <View
                  style={{
                    height: 100,
                    justifyContent: "center"
                  }}
                >
                  <SvgView width={80} height={80} src={TECHLORE_SVG} />
                </View>

                <View
                  style={{
                    height: 100,
                    justifyContent: "center"
                  }}
                >
                  <SvgView width={100} height={100} src={XDA_SVG} />
                </View>

                <View
                  style={{
                    height: 100,
                    justifyContent: "center"
                  }}
                >
                  <SvgView width={100} height={100} src={ANDROID_POLICE_SVG} />
                </View>
              </View>

              <View
                style={{
                  padding: 16,
                  alignSelf: "center",
                  width: isTablet ? 500 : undefined
                }}
              >
                <ReviewItem
                  user="Tagby on Discord"
                  link="https://discord.com/channels/796015620436787241/828701074465619990/1070172521846026271"
                  userImage="data:image/webp;base64,UklGRrAFAABXRUJQVlA4WAoAAAAQAAAATwAATwAAQUxQSAoAAAABB9D+iAhERP8DVlA4IIAFAAAQGACdASpQAFAAPm0skkYkIqGhL1K86IANiWdqN1k9SfbwDoK2qhJsXhBwv+m+3ujg5HTtBysrex6esj/qeU5883L4Rbay65pvw7npaa0yc/fmrdXlgwv8WNtJN9J5m8XMkAKD7lrd98bFKn2UcICVz6fIlJpW6gQDx3Y/lQzupEnm4fyWa/VI47NFSGLJjPe4K/NR5nIh1I+JaGqh5h6Zn/9771gyWEnxRaaHU7LdnMvNnAtVXhm3Ijxrv+9TKC7rtKa+oqC2ewAA/v17lyxCQMDU8AW7okR5UCCzmkNNZqVrX1NJ2Mu1LrM2qc+DCezUOb2Y8MzxK5xRgGrcR0/FAx88Y1KeuT5RUbhRcNNnTw1Un3MWtOlBIXpYjntwwdRskDymt47ZvkH+V5QANy6cAr+Lrol9EOVUxXc8G5bTJLcIHELmBulybx2w+O+btTXtlkgn0JSy0pAWMfZunaztVCHoyNnmWxhHAFMMUSycgx76ovzc8+Hwd/rRUY3/P+B4/y3dQZ9FB+vMiyYCEdci0l8arhH6f0IOVijOkAXiuS8KfnOh76NP5jbRF0qvz63DDZSUmpsXJGnI7phYFgJ5Em+3zIebcKqPcn4M5hznAH9mYIPsv8jeOCg7+DRYljkh4AbTxImyoRrPy9GUeUA1QC290cK+877ce6yyNzQK8jaLEAz53ccPZj/cHk17B2SCVknKQhV7bz6yg6fLGR5AT3qAPfdQsVeHrPLQdRZmw1ll62E7lCU7+WCuHk+xAg1JwiyZsdWlcSf1Oazs7qgdnon9lQNVKgzGSR+I811YKPAS5U3go9ANCZwqsmdQ07Y+ZzCuLukH46D0tWk/kBVgXBzMhOf8bAlayYfIGvIdEXjm6Z4j0SIz3juiY35mCjXXwez84ESBpc3z0c2gWgRFzWx/iyYBjPzJ5s3Mub6xzfsWtYqAmhAPzeoK5pJWgiB6tEyI2oZmLuj7sLVHARnaswrfzDlIUMPXRSZFoq+mmsIF1aKThJDQTNdgnkLjfz3rDkVaqVhk3sg8jZLIOMJUKsYvujEmGRbRlO3hwfL0JvoORLh8rOJ0prBA2Tnra+VA/RMfJtKC/AjVXRu/nH0tmGg2/Wkra7C/OWK9E2NqBVVjJvrgqvNN0V8gYZdScIl0jQSLRzA4emm2HfC+L8c4FCxheZFDMP+zGUH5JyXLkBX/hGWE+CWhcPjSJ8hAj8yBeXCyWpM07eiFPxxkqYF+Wka211fUU/HygHPX+Qj+CyoMjz9gstrjNPTX0zc3r55VrpiFUjxfgOoY32Eojwr9mWg/dcleov8wSmKuJZtzjxiXFzemVIP5kzrDIffxS6PR30mOq+d9k/ZgJfzhyuPr6W8kOmQXmLnMwbpcr1KSSgjOLmu6oBtjexL/ukI77ygGzDtdDfRPpj7klVHu34xcWAufMWOMlo70oenOeQGueYXGWPZW175I30dvCT/Ra2R+0MbxvxmdpmmoQmzC4d7l/MI2MhUHUW5N79x0vXB1PEGs+F3o+6dO+N1qqqXxJP/0N5BvADUF55dX2vpBSAXyN30UPO9IBqC0JkFPwXiOncsUir6r50C47HnS2WadAlu2QpHFL8YrTsSdhP19HAc6zWDM2/RaJZxFFQj/tqw0rYVYX//7iKKSiXWWQma12fG+HhJD2tBjEcp8+vU2nzjmd4tR6AurIEns1SsWg2cFcvrZzyzKFB0gdnvVpoCwouvl8UuSAyYc+rHMVGhWln+a+bhRgIERIb5XlrazMxJOqksed7mUs5ArKpOEuHWPYu+U+E2T1OkeusgAKL57F73Fm2xbIunW/IbW2wawYHv8u1AWGGSAB8XYJOW1XxpqIgq+V34pqd3WRpBGd1G4rGAA"
                  review={`I just want to say thank you so much.

After trying all the privacy security oriented note taking apps, for the price and the features afforded to your users, Notesnook is hands down the best.`}
                />
              </View>
            </View>
            <View
              style={{
                alignItems: "center",
                paddingVertical: 16
              }}
            >
              <Heading>{strings.comparePlans()}</Heading>
            </View>

            <View
              style={{
                alignSelf: isTablet ? "center" : "flex-start",
                flexShrink: 1
              }}
            >
              <ComparePlans pricingPlans={pricingPlans} setStep={setStep} />
            </View>

            <View
              style={{
                alignItems: "center",
                paddingVertical: 16
              }}
            >
              <Heading>{strings.faqs()}</Heading>
            </View>

            <View
              style={{
                paddingHorizontal: 16
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
                Navigation.replace("FluidPanelsView", {});
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

const FAQItem = (props: { question: string; answer: string }) => {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useThemeColors();
  return (
    <TouchableOpacity
      style={{
        padding: 16,
        backgroundColor: colors.secondary.background,
        borderRadius: 10,
        marginBottom: 10,
        gap: 12
      }}
      activeOpacity={0.9}
      onPress={() => {
        setExpanded(!expanded);
      }}
      key={props.question}
    >
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between"
        }}
      >
        <Heading
          style={{
            flexShrink: 1
          }}
          size={AppFontSize.md}
        >
          {props.question}
        </Heading>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          color={colors.secondary.icon}
          size={AppFontSize.xxl}
        />
      </View>
      {expanded ? (
        <Paragraph size={AppFontSize.md}>{props.answer}</Paragraph>
      ) : null}
    </TouchableOpacity>
  );
};

const ComparePlans = React.memo(
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

const ReviewItem = (props: {
  review: string;
  user: string;
  link: string;
  userImage?: string;
}) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        width: "100%",
        padding: 16,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: colors.primary.border,
        gap: 16
      }}
    >
      <Paragraph
        onPress={() => {
          openLinkInBrowser(props.link);
        }}
        style={{
          textAlign: "center"
        }}
        size={AppFontSize.md}
      >
        {props.review}
      </Paragraph>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          alignSelf: "center",
          backgroundColor: colors.secondary.background,
          borderRadius: 100,
          padding: 6,
          paddingHorizontal: 12
        }}
      >
        {props.userImage ? (
          <Image
            source={{
              uri: props.userImage
            }}
            style={{
              width: 20,
              height: 20,
              borderRadius: 100
            }}
          />
        ) : null}
        <Paragraph size={AppFontSize.sm}>{props.user}</Paragraph>
      </View>
    </View>
  );
};
const PricingPlanCard = ({
  plan,
  pricingPlans,
  annualBilling,
  setStep
}: {
  plan: PricingPlan;
  pricingPlans?: ReturnType<typeof usePricingPlans>;
  annualBilling?: boolean;
  setStep: (step: number) => void;
}) => {
  const { colors } = useThemeColors();
  const [regionalDiscount, setRegionaDiscount] = useState<SKUResponse>();
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const product =
    plan.subscriptions?.[
      regionalDiscount?.sku ||
        `notesnook.${plan.id}.${annualBilling ? "yearly" : "monthly"}`
    ];

  const WebPlan = pricingPlans?.getWebPlan(
    plan.id,
    annualBilling ? "yearly" : "monthly"
  );

  const price = pricingPlans?.getPrice(
    pricingPlans.isGithubRelease && WebPlan
      ? WebPlan
      : (product as RNIap.Subscription),
    pricingPlans.hasTrialOffer(plan.id, product?.productId) ? 1 : 0,
    annualBilling
  );

  useEffect(() => {
    if (pricingPlans?.isGithubRelease || !annualBilling) return;
    pricingPlans
      ?.getRegionalDiscount(
        plan.id,
        pricingPlans.isGithubRelease
          ? (WebPlan?.period as string)
          : `notesnook.${plan.id}.${annualBilling ? "yearly" : "monthly"}`
      )
      .then((value) => {
        setRegionaDiscount(value);
      });
  }, [annualBilling]);

  useEffect(() => {
    if (!annualBilling) {
      setRegionaDiscount(undefined);
    }
  }, [annualBilling]);

  const isSubscribed =
    product?.productId &&
    pricingPlans?.user?.subscription?.productId?.includes(plan.id) &&
    pricingPlans.isSubscribed();

  const isNotReady =
    pricingPlans?.loadingPlans || (!price && !WebPlan?.price?.gross);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (isNotReady) return;
        const currentPlanSubscribed =
          PremiumService.get() &&
          (pricingPlans?.user?.subscription?.productId ===
            (product as RNIap.Subscription)?.productId ||
            pricingPlans?.user?.subscription?.productId?.startsWith(
              (product as RNIap.Subscription)?.productId
            ));
        pricingPlans?.selectPlan(
          plan.id,
          currentPlanSubscribed
            ? `notesnook.${plan.id}.${
                !(product as RNIap.Subscription)?.productId.includes("yearly")
                  ? "yearly"
                  : "monthly"
              }`
            : pricingPlans.isGithubRelease
              ? (WebPlan?.period as string)
              : (product?.productId as string)
        );
        setStep(Steps.buy);
      }}
      style={{
        ...getElevationStyle(3),
        backgroundColor: colors.primary.background,
        borderWidth: 1,
        borderColor:
          plan.id === "pro" ? colors.primary.accent : colors.primary.border,
        borderRadius: 10,
        padding: 16,
        width: isTablet ? undefined : "100%",
        flexShrink: isTablet ? 1 : undefined,
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 6
      }}
    >
      {regionalDiscount?.discount || WebPlan?.discount ? (
        <View
          style={{
            backgroundColor: colors.static.red,
            borderRadius: defaultBorderRadius,
            paddingHorizontal: 6,
            alignItems: "center",
            justifyContent: "center",
            height: 25,
            alignSelf: "flex-start"
          }}
        >
          <Heading color={colors.static.white} size={AppFontSize.xs}>
            {strings.specialOffer()}{" "}
            {strings.percentOff(
              `${regionalDiscount?.discount || WebPlan?.discount?.amount}`
            )}
          </Heading>
        </View>
      ) : null}

      <View>
        <Heading size={AppFontSize.md}>
          {plan.name}{" "}
          {plan.recommended ? (
            <Text
              style={{
                color: colors.primary.accent,
                fontSize: 12
              }}
            >
              ({strings.recommended()})
            </Text>
          ) : null}
        </Heading>
        <Paragraph>{plan.description}</Paragraph>

        <View
          style={{
            gap: 5,
            marginVertical: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between"
            }}
          >
            <Paragraph size={AppFontSize.xs}>{strings.storage()}</Paragraph>

            <Paragraph size={AppFontSize.xs}>
              {PlanOverView[plan.id as keyof typeof PlanOverView].storage}
            </Paragraph>
          </View>

          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between"
            }}
          >
            <Paragraph size={AppFontSize.xs}>{strings.fileSize()}</Paragraph>

            <Paragraph size={AppFontSize.xs}>
              {PlanOverView[plan.id as keyof typeof PlanOverView].fileSize}
            </Paragraph>
          </View>

          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between"
            }}
          >
            <Paragraph size={AppFontSize.xs}>{strings.hdImages()}</Paragraph>

            <Paragraph size={AppFontSize.xs}>
              {PlanOverView[plan.id as keyof typeof PlanOverView].hdImages
                ? strings.yes()
                : strings.no()}
            </Paragraph>
          </View>
        </View>
      </View>

      {pricingPlans?.loadingPlans || (!price && !WebPlan?.price?.gross) ? (
        <ActivityIndicator size="small" color={colors.primary.accent} />
      ) : (
        <View>
          <Paragraph size={AppFontSize.lg}>
            {price || `${WebPlan?.price?.currency} ${WebPlan?.price?.gross}`}{" "}
            <Paragraph>/{strings.month()}</Paragraph>
          </Paragraph>

          {!product && !WebPlan ? null : (
            <Paragraph color={colors.secondary.paragraph} size={AppFontSize.xs}>
              {annualBilling
                ? strings.billedAnnually(
                    pricingPlans?.getStandardPrice(
                      (product || WebPlan) as any
                    ) as string
                  )
                : strings.billedMonthly(
                    pricingPlans?.getStandardPrice(
                      (product || WebPlan) as any
                    ) as string
                  )}
            </Paragraph>
          )}

          {isSubscribed ? (
            <View
              style={{
                backgroundColor: colors.primary.accent,
                borderRadius: defaultBorderRadius,
                paddingHorizontal: 6,
                alignItems: "center",
                justifyContent: "center",
                height: 25,
                alignSelf: "flex-start",
                marginTop: DefaultAppStyles.GAP_VERTICAL
              }}
            >
              <Heading color={colors.static.white} size={AppFontSize.xs}>
                {strings.currentPlan()}
              </Heading>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default PayWall;
