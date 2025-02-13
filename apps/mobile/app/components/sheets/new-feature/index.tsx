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
import React from "react";
import { Platform, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { getVersion } from "react-native-device-info";
import { features } from "../../../features";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { eCloseSheet } from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
export type FeatureType = {
  title: string;
  body: string;
  platform?: "ios" | "android";
};

const NewFeature = ({
  features,
  version
}: {
  features: FeatureType[];
  version?: string;
}) => {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 12,
        paddingTop: 12,
        maxHeight: "100%"
      }}
    >
      <Heading color={colors.secondary.heading} size={AppFontSize.md}>
        {strings.newVersionHighlights(version)}
      </Heading>

      <Seperator />

      <ScrollView>
        {features.map((item) => (
          <View
            key={item.title}
            style={{
              backgroundColor: colors.secondary.background,
              padding: 12,
              borderRadius: 10,
              width: "100%",
              marginBottom: 10
            }}
          >
            <Heading size={AppFontSize.lg - 2}>{item.title}</Heading>
            <Paragraph selectable>{item.body}</Paragraph>
          </View>
        ))}
      </ScrollView>
      <Seperator />

      <Button
        title={strings.gotIt()}
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
  if (!version || version === getVersion()) {
    SettingsService.set({
      version: getVersion()
    });
    return false;
  }

  SettingsService.set({
    version: getVersion()
  });
  const _features = features?.filter(
    (feature) => !feature.platform || feature.platform === Platform.OS
  );
  if (_features.length === 0) return;
  presentSheet({
    component: (
      <NewFeature
        features={features}
        version={SettingsService.getProperty("version") || undefined}
      />
    ),
    disableClosing: true
  });
  return true;
};

export default NewFeature;
