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
import { CirclePartner, SubscriptionStatus } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useState } from "react";
import { useAsync } from "react-async-hook";
import { ActivityIndicator, Image, ScrollView, View } from "react-native";
import { db } from "../../../common/database";
import { Radius, Spacing } from "../../../common/design/spacing";
import { presentDialog } from "../../../components/dialog/functions";
import { Button } from "../../../components/ui/button";
import { Notice } from "../../../components/ui/notice";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import { eSendEvent, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import PremiumService from "../../../services/premium";
import { useUserStore } from "../../../stores/use-user-store";
import { eCloseSimpleDialog } from "../../../utils/events";
import { openLinkInBrowser } from "../../../utils/functions";
import { AppFontSize } from "../../../utils/size";
import { sleep } from "../../../utils/time";
let p: any;
export const NotesnookCircle = () => {
  const user = useUserStore((state) => state.user);
  const isOnTrial =
    PremiumService.get() &&
    user?.subscription?.status === SubscriptionStatus.TRIAL;
  const isFree = !PremiumService.get();
  const partners = useAsync(db.circle.partners, [], {
    initialState: () => p
  });
  p = partners.result;

  useEffect(() => {
    if (isFree || isOnTrial) {
      presentDialog({
        icon: "warning-circle",
        centered: true,
        iconFamily: "notesnook",
        iconType: "error",
        title: strings.subscriptionRequired(),
        paragraph: isFree
          ? strings.freeUserCircleNotice()
          : strings.trialUserCircleNotice(),
        positiveText: isFree ? strings.upgradeNow() : strings.close(),
        positivePress: async () => {
          if (!isFree) {
            Navigation.goBack();
            return;
          }
          eSendEvent(eCloseSimpleDialog);
          await sleep(300);
          Navigation.navigate("PayWall", {
            context: "logged-in"
          });
          return true;
        },
        onClose: () => {
          Navigation.goBack();
        }
      });
    }
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{
        gap: Spacing.LEVEL_3,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_0
      }}
    >
      <View
        style={{
          gap: Spacing.LEVEL_0
        }}
      >
        <Heading fontSize="XL">Partner offers</Heading>
        <Paragraph>
          Get exclusive discounts from our trusted partners who share our
          commitment to privacy and user freedom.
        </Paragraph>
      </View>

      {!isFree && !isOnTrial ? null : (
        <View>
          <Paragraph>
            {isFree
              ? strings.freeUserCircleNotice()
              : strings.trialUserCircleNotice()}
          </Paragraph>

          {isOnTrial ? null : (
            <Button
              title={strings.upgradePlan()}
              onPress={() => {
                Navigation.navigate("PayWall", {
                  canGoBack: true,
                  context: useUserStore.getState().user
                    ? "logged-in"
                    : "logged-out"
                });
              }}
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 0
              }}
            />
          )}
        </View>
      )}

      {partners.loading ? <ActivityIndicator /> : null}

      {partners.error ? (
        <Notice type="alert" text={partners.error.message} />
      ) : null}

      {partners.result?.map((item) => (
        <Partner key={item.id} item={item} available={!isFree && !isOnTrial} />
      ))}
    </ScrollView>
  );
};

const Partner = ({
  item,
  available
}: {
  item: CirclePartner;
  available: boolean;
}) => {
  const { colors } = useThemeColors();
  const [code, setCode] = useState<string>();

  return (
    <View
      style={{
        borderRadius: Radius.MD,
        backgroundColor: colors.secondary.background,
        padding: Spacing.LEVEL_3,
        gap: Spacing.LEVEL_1
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: Spacing.LEVEL_1
        }}
      >
        <Image
          src={item.logoBase64}
          style={{
            width: 24,
            height: 24
          }}
        />
        <Heading>{item.name}</Heading>
      </View>

      <Paragraph fontSize="XS">{item.longDescription.trim()}</Paragraph>

      <View
        style={{
          width: "100%",
          borderRadius: Radius.XS,
          backgroundColor: colors.primary.shade,
          paddingVertical: 4,
          paddingHorizontal: 8
        }}
      >
        <Paragraph fontSize="XS" color={colors.primary.accent}>
          {item.offerDescription}
        </Paragraph>
      </View>

      {available ? (
        <>
          {!code ? (
            <Button
              type="tertiary"
              style={{
                borderWidth: 1,
                borderColor: colors.primary.border
              }}
              title={strings.redeemCode()}
              width="100%"
              onPress={() => {
                if (!PremiumService.get()) {
                  Navigation.navigate("PayWall", {
                    canGoBack: true,
                    context: useUserStore.getState().user
                      ? "logged-in"
                      : "logged-out"
                  });
                  return;
                }

                db.circle
                  .redeem(item.id)
                  .then((result) => setCode(result?.code))
                  .catch((e) => ToastManager.error(e));
              }}
            />
          ) : (
            <>
              <View
                style={{
                  alignItems: "center",
                  flexDirection: "row",
                  gap: Spacing.LEVEL_2
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.tertiary.background,
                    borderRadius: Radius.XS,
                    paddingVertical: Spacing.LEVEL_1,
                    paddingHorizontal: Spacing.LEVEL_2,
                    flexGrow: 1
                  }}
                >
                  <Paragraph
                    color={colors.secondary.paragraph}
                    size={AppFontSize.xs}
                  >
                    Discount code
                  </Paragraph>
                  <Paragraph
                    size={AppFontSize.xxs}
                    color={colors.primary.heading}
                    fontFamily="SEMI_BOLD"
                  >
                    {code}
                  </Paragraph>
                </View>

                <Button
                  title={strings.copy()}
                  type="accent"
                  style={{
                    paddingVertical: 0,
                    height: "100%"
                  }}
                  onPress={() => {
                    Clipboard.setString(code);
                  }}
                />
              </View>

              {item.codeRedeemUrl ? (
                <Paragraph
                  fontSize="XS"
                  color={colors.primary.accent}
                  fontFamily="MEDIUM"
                  style={{
                    textDecorationLine: "underline"
                  }}
                  onPress={() => {
                    if (item.codeRedeemUrl) {
                      openLinkInBrowser(
                        item.codeRedeemUrl.replace("{{code}}", code)
                      );
                    }
                  }}
                >
                  {strings.claimPromotion.clickHere()}{" "}
                  <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
                    {strings.claimPromotion.toClaim()}
                  </Paragraph>
                </Paragraph>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </View>
  );
};
