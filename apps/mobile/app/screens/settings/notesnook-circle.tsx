import { CirclePartner, SubscriptionStatus } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import { useState } from "react";
import { useAsync } from "react-async-hook";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../common/database";
import AppIcon from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/button";
import { Notice } from "../../components/ui/notice";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import PremiumService from "../../services/premium";
import { useUserStore } from "../../stores/use-user-store";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { openLinkInBrowser } from "../../utils/functions";
import { Pressable } from "../../components/ui/pressable";

export const NotesnookCircle = () => {
  const user = useUserStore((state) => state.user);
  const isOnTrial =
    PremiumService.get() &&
    user?.subscription?.status === SubscriptionStatus.TRIAL;
  const isFree = !PremiumService.get();
  const partners = useAsync(db.circle.partners, []);

  return (
    <ScrollView
      contentContainerStyle={{
        gap: DefaultAppStyles.GAP_VERTICAL,
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingTop: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      {!isFree && !isOnTrial ? null : (
        <View>
          <Paragraph>
            {isFree
              ? strings.freeUserCircleNotice()
              : strings.trialUserCircleNotice()}
          </Paragraph>

          {!isOnTrial ? null : (
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
        <Partner item={item} available={!isFree && !isOnTrial} />
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
        borderRadius: defaultBorderRadius,
        borderWidth: 1,
        borderColor: colors.primary.border,
        padding: DefaultAppStyles.GAP,
        gap: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Heading>{item.name}</Heading>
        <Image
          src={item.logoBase64}
          style={{
            width: 40,
            height: 40
          }}
        />
      </View>

      <Paragraph style={{ textAlign: "justify" }}>
        {item.longDescription.trim()}
      </Paragraph>

      <Paragraph
        style={{
          alignSelf: "center"
        }}
        color={colors.primary.accent}
      >
        {item.offerDescription}
      </Paragraph>

      {available ? (
        <>
          {!code ? (
            <Button
              type="accent"
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
              <TouchableOpacity
                style={{
                  backgroundColor: colors.secondary.background,
                  borderRadius: defaultBorderRadius,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: DefaultAppStyles.GAP_SMALL,
                  borderWidth: 0.5,
                  borderColor: colors.secondary.border,
                  flexDirection: "row",
                  gap: DefaultAppStyles.GAP_SMALL
                }}
                activeOpacity={0.9}
                onPress={() => {
                  Clipboard.setString(code);
                }}
              >
                <Paragraph
                  size={AppFontSize.lg}
                  color={colors.secondary.paragraph}
                >
                  {code}
                </Paragraph>

                <AppIcon name="content-copy" />
              </TouchableOpacity>

              {item.codeRedeemUrl ? (
                <Pressable
                  onPress={() => {
                    if (item.codeRedeemUrl) {
                      openLinkInBrowser(
                        item.codeRedeemUrl.replace("{{code}}", code)
                      );
                    }
                  }}
                >
                  <Paragraph
                    color={colors.secondary.paragraph}
                    size={AppFontSize.xxs}
                  >
                    {strings.clickToDirectlyClaimPromo()}
                  </Paragraph>
                </Pressable>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </View>
  );
};
