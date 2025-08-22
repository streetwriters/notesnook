import {
  FeatureUsage,
  formatBytes,
  getFeature,
  getFeaturesUsage
} from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import Paragraph from "../../ui/typography/paragraph";
import Heading from "../../ui/typography/heading";
import Navigation from "../../../services/navigation";
import { Button } from "../../ui/button";
import { eSendEvent } from "../../../services/event-manager";
import { eCloseSheet } from "../../../utils/events";

export function PlanLimits() {
  const { colors } = useThemeColors();
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>();

  useEffect(() => {
    getFeaturesUsage()
      .then((result) => {
        setFeatureUsage(result);
      })
      .catch((e) => console.log(e));
  }, []);

  return (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        width: "100%",
        paddingVertical: DefaultAppStyles.GAP_VERTICAL,
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

      <Button
        title={strings.upgradePlan()}
        onPress={() => {
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
    </View>
  );
}
