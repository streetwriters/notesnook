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

import React from "react";
import { Platform, View } from "react-native";
import { getVersion } from "react-native-device-info";
import { features } from "../../../features";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { useThemeStore } from "../../../stores/use-theme-store";
import { eCloseSheet } from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
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
          eSendEvent(eCloseSheet);
        }}
      />
    </View>
  );
};

NewFeature.present = () => {
  const { version, introCompleted } = SettingsService.get();
  if (!introCompleted) {
    SettingsService.set({
      version: getVersion()
    });
    return;
  }
  if (version && version === getVersion()) return false;
  // SettingsService.set({
  //   version: getVersion()
  // });
  const _features = features?.filter(
    (feature) => !feature.platform || feature.platform === Platform.OS
  );
  if (_features.length === 0) return;
  presentSheet({
    component: <NewFeature features={features} />
  });
  return true;
};

export default NewFeature;
