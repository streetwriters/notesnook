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
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  NativeEventSubscription,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import * as RNIap from "react-native-iap";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ToggleSwitch from "toggle-switch-react-native";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import usePricingPlans, { PricingPlan } from "../../hooks/use-pricing-plans";
import Navigation, { NavigationProps } from "../../services/navigation";
import { getElevationStyle } from "../../utils/elevation";
import { openLinkInBrowser } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Header } from "../header";
import { BuyPlan } from "../sheets/buy-plan";
import { Toast } from "../toast";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { FeaturesList } from "./features-list";

const Steps = {
  select: 1,
  buy: 2,
  finish: 3
};

const PayWall = (props: NavigationProps<"PayWall">) => {
  const routeParams = props.route.params;
  const { colors } = useThemeColors();
  const pricingPlans = usePricingPlans();
  const [annualBilling, setAnnualBilling] = useState(true);
  const [step, setStep] = useState(Steps.select);
  const isFocused = useNavigationFocus(props.navigation, {
    onBlur: () => true,
    onFocus: () => true
  });

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
      listener.remove();
    };
  }, [isFocused, step]);

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.primary.background,
        flex: 1
      }}
    >
      {routeParams.context === "signup" && step === Steps.select ? null : (
        <Header
          canGoBack={true}
          onLeftMenuButtonPress={() => {
            if (step === Steps.buy) {
              setStep(Steps.select);
              return;
            }
            props.navigation.goBack();
          }}
          title={
            step === Steps.buy
              ? pricingPlans.userCanRequestTrial
                ? `Try ${pricingPlans.currentPlan?.name} plan for free`
                : `${pricingPlans.currentPlan?.name} plan`
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
                <Icon name="crown" size={30} color={colors.static.orange} />
                <Heading
                  key="heading"
                  size={AppFontSize.xl}
                  style={{
                    alignSelf: "center"
                  }}
                >
                  Notesnook{" "}
                  <Heading size={AppFontSize.xl} color={colors.primary.accent}>
                    Plans
                  </Heading>
                </Heading>
              </View>

              <Paragraph key="description" size={AppFontSize.md}>
                Ready to take the next step on your private note taking journey?
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
                <Paragraph>Monthly</Paragraph>
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
                <Paragraph>Yearly </Paragraph>
              </TouchableOpacity>

              {pricingPlans.pricingPlans.map((plan) => (
                <PricingPlanCard
                  key={plan.id}
                  plan={plan}
                  pricingPlans={pricingPlans}
                  annualBilling={annualBilling}
                />
              ))}
            </View>

            <View
              style={{
                marginTop: 20,
                flexDirection: "row",
                maxWidth: "100%",
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
                  paddingVertical: 30,
                  alignItems: "center",
                  flexWrap: "wrap",
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
                  size={AppFontSize.lg}
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
                  paddingVertical: 30,
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
                  size={AppFontSize.lg}
                >
                  8.7K stars
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
                  paddingVertical: 30,
                  alignItems: "center",
                  flexGrow: 1
                }}
              >
                <Image
                  source={{
                    uri: "data:image/png;base64,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"
                  }}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 10
                  }}
                />
                <Paragraph
                  style={{
                    flexShrink: 1,
                    maxWidth: 300,
                    textAlign: "center"
                  }}
                  size={AppFontSize.lg}
                >
                  Recommended by Privacy Guides
                </Paragraph>
              </TouchableOpacity>
            </View>

            <View
              style={{
                width: "100%",
                paddingHorizontal: 16,
                alignItems: "center",
                paddingBottom: 16
              }}
            >
              <Heading
                style={{
                  marginBottom: 20
                }}
              >
                Featured on
              </Heading>

              <Image
                source={{
                  uri: `data:image/png;base64,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`
                }}
                style={{
                  width: 100,
                  height: 100
                }}
              />

              <Image
                source={{
                  uri: `data:image/png;base64,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`
                }}
                resizeMode="contain"
                tintColor={colors.primary.paragraph}
                style={{
                  width: 150,
                  height: 150,
                  opacity: 0.5
                }}
              />

              <Image
                source={{
                  uri: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXAAAABuCAIAAACx0N83AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDYuMC1jMDAyIDc5LjE2NDQ2MCwgMjAyMC8wNS8xMi0xNjowNDoxNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjIgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkZCOURBMzA5RjJDNDExRUE4Q0UyQzZGQUExRUI1RDI3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkZCOURBMzBBRjJDNDExRUE4Q0UyQzZGQUExRUI1RDI3Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RkI5REEzMDdGMkM0MTFFQThDRTJDNkZBQTFFQjVEMjciIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RkI5REEzMDhGMkM0MTFFQThDRTJDNkZBQTFFQjVEMjciLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4OmF/2AAAcd0lEQVR42uxdeXgc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`
                }}
                resizeMode="contain"
                style={{
                  width: 368 * 0.5,
                  height: 110 * 0.5,
                  opacity: 0.5
                }}
              />
            </View>

            <View
              style={{
                padding: 16
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
            <View
              style={{
                alignItems: "center",
                paddingVertical: 16
              }}
            >
              <Heading>Compare plans</Heading>
            </View>
            <ComparePlans />
            <View
              style={{
                alignItems: "center",
                paddingVertical: 16
              }}
            >
              <Heading>FAQs</Heading>
            </View>

            <View
              style={{
                paddingHorizontal: 16,
                paddingBottom: 16
              }}
            >
              {[
                {
                  question: "What happens after my free trial ends?",
                  answer: `You will be automatically subscribed to the plan you selected during the trial period.`
                },
                {
                  question: "What happens if I don't renew my subscription?",
                  answer: `You will be`
                },
                {
                  question: "What happens if I don't renew my subscription?",
                  answer: `You will be`
                }
              ].map((item) => (
                <FAQItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </View>
          </ScrollView>

          <View
            style={{
              width: "100%",
              backgroundColor: colors.primary.background,
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderTopWidth: 1,
              borderTopColor: colors.primary.border,
              position: "absolute",
              paddingBottom: DefaultAppStyles.GAP_VERTICAL,
              bottom: 0
            }}
          >
            <Button
              width="100%"
              type="accent"
              title={
                pricingPlans.currentPlan?.id === "free"
                  ? "I'll stay on the Free plan"
                  : pricingPlans.userCanRequestTrial
                  ? `Start ${annualBilling ? "14" : "7"} days free trial`
                  : "Subscribe"
              }
              onPress={() => {
                if (pricingPlans.currentPlan?.id === "free") {
                  if (routeParams.context === "signup") {
                    Navigation.replace("FluidPanelsView", {});
                  } else {
                    Navigation.goBack();
                  }
                }
                if (
                  !pricingPlans.currentPlan?.id ||
                  !pricingPlans.selectedProduct
                )
                  return;
                setStep(Steps.buy);
              }}
            />
          </View>
        </>
      ) : step === Steps.buy ? (
        <BuyPlan
          planId={pricingPlans.currentPlan?.id as string}
          productId={
            annualBilling
              ? `notesnook.${pricingPlans?.currentPlan?.id as string}.yearly`
              : `notesnook.${pricingPlans?.currentPlan?.id as string}.monthly`
          }
          canActivateTrial={pricingPlans.userCanRequestTrial}
          goBack={() => {
            setStep(Steps.select);
          }}
          goNext={() => {
            setStep(Steps.finish);
          }}
        />
      ) : (
        <View />
      )}

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
  () => {
    const { colors } = useThemeColors();
    return (
      <ScrollView
        horizontal
        style={{
          width: "100%"
        }}
        contentContainerStyle={{
          flexDirection: "column"
        }}
      >
        {Object.keys(FeaturesList).map((key, keyIndex) => {
          return (
            <View
              key={key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                gap: 10
              }}
            >
              {[
                key === "Plans" ? "" : key,
                ...FeaturesList[key as keyof typeof FeaturesList]
              ].map((item, index) => (
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
                  key={item + key + index}
                >
                  {item === true ? (
                    <Icon
                      color={colors.primary.accent}
                      size={AppFontSize.sm}
                      name="check"
                    />
                  ) : item === false ? (
                    <Icon
                      size={AppFontSize.sm}
                      color={colors.static.red}
                      name="close"
                    />
                  ) : keyIndex === 0 ? (
                    <Heading size={AppFontSize.sm}>{item}</Heading>
                  ) : (
                    <Paragraph>{item}</Paragraph>
                  )}
                </View>
              ))}
            </View>
          );
        })}
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
  annualBilling
}: {
  plan: PricingPlan;
  pricingPlans?: ReturnType<typeof usePricingPlans>;
  annualBilling?: boolean;
}) => {
  const { colors } = useThemeColors();
  const isSelected = pricingPlans?.currentPlan?.id === plan.id;
  const isFreePlan = plan.id === "free";

  const product =
    plan.subscriptions?.[
      `notesnook.${plan.id}.${annualBilling ? "yearly" : "monthly"}`
    ];

  const discountPercentage = annualBilling
    ? pricingPlans?.compareProductPrice(
        plan.id,
        `notesnook.${plan.id}.yearly`,
        `notesnook.${plan.id}.monthly`
      )
    : null;

  const price = pricingPlans?.getPrice(
    product as RNIap.Subscription,
    1,
    annualBilling
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        pricingPlans?.selectPlan(plan.id);
      }}
      style={{
        ...getElevationStyle(3),
        backgroundColor: colors.primary.background,
        borderWidth: 1,
        borderColor: isSelected ? colors.primary.accent : colors.primary.border,
        borderRadius: 10,
        padding: 16,
        width: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 6
      }}
    >
      {discountPercentage ? (
        <View
          style={{
            backgroundColor: colors.static.red,
            borderRadius: 100,
            paddingHorizontal: 6,
            alignItems: "center",
            justifyContent: "center",
            height: 25,
            alignSelf: "flex-start"
          }}
        >
          <Heading color={colors.static.white} size={AppFontSize.xs}>
            {discountPercentage}% Off
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
              (Recommended)
            </Text>
          ) : null}
        </Heading>
        <Paragraph>{plan.description}</Paragraph>
      </View>

      {pricingPlans?.loading ? (
        <ActivityIndicator size="small" color={colors.primary.accent} />
      ) : (
        <View>
          <Paragraph size={AppFontSize.lg}>
            {isFreePlan ? "0.00" : price} <Paragraph>/month</Paragraph>
          </Paragraph>

          {isFreePlan ? null : (
            <Paragraph color={colors.secondary.paragraph} size={AppFontSize.xs}>
              billed {annualBilling ? "annually" : "monthly"} at{" "}
              {pricingPlans?.getStandardPrice(product as RNIap.Subscription)}{" "}
            </Paragraph>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default PayWall;
