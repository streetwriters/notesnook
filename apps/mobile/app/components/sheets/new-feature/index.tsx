import React from "react";
import { Platform, View } from "react-native";
import { APP_VERSION } from "../../../version";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { useThemeStore } from "../../../stores/use-theme-store";
import { eCloseProgressDialog } from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { features } from "../../../features";
export type FeatureType = {
  title: string;
  body: string;
  platform?: "ios" | "android";
};

const NewFeature = ({ features }: { features: FeatureType[] }) => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 12,
        paddingTop: 12
      }}
    >
      <Heading color={colors.icon} size={SIZE.md}>
        New Version Highlights 🎉
      </Heading>

      <Seperator />

      {features.map((item) => (
        <View
          key={item.title}
          style={{
            backgroundColor: colors.nav,
            padding: 12,
            borderRadius: 10,
            width: "100%",
            marginBottom: 10
          }}
        >
          <Heading size={SIZE.lg - 2}>{item.title}</Heading>
          <Paragraph>{item.body}</Paragraph>
        </View>
      ))}
      <Seperator />

      <Button
        title="Got it"
        type="accent"
        width={250}
        style={{
          borderRadius: 100
        }}
        onPress={() => {
          eSendEvent(eCloseProgressDialog);
        }}
      />
    </View>
  );
};

NewFeature.present = () => {
  const { version, introCompleted } = SettingsService.get();
  if (!introCompleted) {
    SettingsService.set({
      version: APP_VERSION
    });
    return;
  }
  if (version && version === APP_VERSION) return false;
  SettingsService.set({
    version: APP_VERSION
  });
  let _features = features?.filter(
    (feature) => !feature.platform || feature.platform === Platform.OS
  );
  if (_features.length === 0) return;
  presentSheet({
    component: <NewFeature features={features} />
  });
  return true;
};

export default NewFeature;
