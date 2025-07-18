import { View, Text } from "react-native";
import { presentSheet } from "../../../services/event-manager";
import { FeatureId, FeatureResult } from "@notesnook/common";

export default function PaywallSheet<Tid extends FeatureId>(props: {
  feature: FeatureResult<Tid>;
}) {
  return (
    <View
      style={{
        height: 400,
        width: "100%",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {/* Paywall content goes here */}
      <View>
        {/* Example content */}
        <Text>Upgrade to Pro for more features!</Text>
      </View>
    </View>
  );
}

PaywallSheet.present = <Tid extends FeatureId>(feature: FeatureResult<Tid>) => {
  presentSheet({
    component: <PaywallSheet feature={feature} />
  });
};
