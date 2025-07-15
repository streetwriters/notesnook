import { View, Text } from "react-native";
import { presentSheet } from "../../../services/event-manager";

export default function PaywallSheet() {
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

PaywallSheet.present = () => {
  presentSheet({
    component: <PaywallSheet />
  });
};
