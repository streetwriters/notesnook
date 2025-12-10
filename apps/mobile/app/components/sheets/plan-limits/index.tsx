import {
  FeatureUsage,
  formatBytes,
  getFeature,
  getFeaturesUsage
} from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { eSendEvent, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { eCloseSheet } from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { SubscriptionPlan, SubscriptionProvider } from "@notesnook/core";
import { useUserStore } from "../../../stores/use-user-store";
import PremiumService from "../../../services/premium";
import SettingsService from "../../../services/settings";

export function PlanLimits() {
  const { colors } = useThemeColors();
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    getFeaturesUsage()
      .then((result) => {
        setFeatureUsage(result);
      })
      .catch((e) => console.log(e));
  }, []);

  const isCurrentPlatform =
    (user?.subscription?.provider === SubscriptionProvider.APPLE &&
      Platform.OS === "ios") ||
    (user?.subscription?.provider === SubscriptionProvider.GOOGLE &&
      Platform.OS === "android");

  return (
    <ScrollView
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        width: "100%",
        paddingVertical: DefaultAppStyles.GAP_VERTICAL
      }}
      contentContainerStyle={{
        gap: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      <Heading>{strings.planLimits()}</Heading>

      {featureUsage?.map((item) => (
        <View
          key={item.id}
          style={{
            gap: DefaultAppStyles.GAP_VERTICAL_SMALL,
            width: "100%"
          }}
        >
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between"
            }}
          >
            <Paragraph size={AppFontSize.sm}>
              {getFeature(item.id).title}
            </Paragraph>
            <Paragraph size={AppFontSize.sm}>
              {item.total === Infinity
                ? strings.unlimited()
                : item.id === "storage"
                ? `${formatBytes(item.used)}/${formatBytes(
                    item.total
                  )} ${strings.used()}`
                : `${item.used}/${item.total} ${strings.used()}`}
            </Paragraph>
          </View>
        </View>
      ))}

      {((user?.subscription?.provider === SubscriptionProvider.PADDLE ||
        user?.subscription?.provider === SubscriptionProvider.STREETWRITERS ||
        !isCurrentPlatform) &&
        PremiumService.get()) ||
      SettingsService.getProperty("serverUrls") ? null : (
        <Button
          title={strings.changePlan()}
          onPress={() => {
            if (user?.subscription?.plan === SubscriptionPlan.LEGACY_PRO) {
              ToastManager.show({
                message: strings.cannotChangePlan(),
                context: "local"
              });
              return;
            }

            if (
              user?.subscription.plan !== SubscriptionPlan.FREE &&
              user?.subscription.productId?.includes("5year")
            ) {
              ToastManager.show({
                message:
                  "You have made a one time purchase. To change your plan please contact support.",
                type: "info",
                context: "local"
              });
              return;
            }
            Navigation.navigate("PayWall", {
              context: "logged-in",
              canGoBack: true
            });
            eSendEvent(eCloseSheet);
          }}
          type="accent"
          fontSize={AppFontSize.xs}
          style={{
            width: "100%",
            marginTop: DefaultAppStyles.GAP_VERTICAL
          }}
        />
      )}
    </ScrollView>
  );
}
