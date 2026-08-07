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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { Linking, View } from "react-native";
import { Radius, Spacing } from "../../../common/design/spacing";
import { Button } from "../../ui/button";
import AppIcon from "../../ui/AppIcon";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { AppFontSize } from "../../../utils/size";
import { presentSheet, eSendEvent } from "../../../services/event-manager";
import { eCloseSheet } from "../../../utils/events";
import { sleep } from "../../../utils/time";
import { Progress } from "../progress";
import Sync from "../../../services/sync";

type ForceSyncMode = "fetch" | "send";

type ForceSyncProps = {
  mode: ForceSyncMode;
  close?: (ctx?: string) => void;
};

function ForceSync({ mode, close }: ForceSyncProps) {
  const { colors } = useThemeColors();
  const [acknowledged, setAcknowledged] = useState(true);

  const onForceSyncPress = async () => {
    if (!acknowledged) return;

    close?.();
    await sleep(300);
    Progress.present();
    Sync.run("global", true, mode, () => {
      eSendEvent(eCloseSheet);
    });
  };

  const title =
    mode === "fetch" ? strings.forcePullChanges() : strings.forcePushChanges();
  const description =
    mode === "fetch"
      ? strings.forceSyncPullSheetDesc()
      : strings.forceSyncPushSheetDesc();
  const actionText =
    mode === "fetch" ? strings.forcePullAction() : strings.forcePushAction();

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_2,
        gap: Spacing.LEVEL_3
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Spacing.LEVEL_1
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: Radius.XS,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.error.background
          }}
        >
          <AppIcon
            name="warning"
            iconFamily="notesnook"
            size={16}
            color={colors.error.accent}
          />
        </View>

        <View
          style={{
            flex: 1,
            gap: Spacing.LEVEL_0
          }}
        >
          <Heading size={AppFontSize.lg} lineHeight="100%">
            {title}
          </Heading>
          <Paragraph size={AppFontSize.xs}>{description}</Paragraph>
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.primary.separator
        }}
      />

      <View
        style={{
          gap: Spacing.LEVEL_2
        }}
      >
        <Paragraph size={AppFontSize.sm}>
          {strings.forceSyncWarningShort()}
        </Paragraph>
        <View
          style={{
            gap: Spacing.LEVEL_0
          }}
        >
          <Paragraph size={AppFontSize.sm}>
            {strings.forceSyncNeedHelpContact()}
          </Paragraph>
          <Paragraph
            size={AppFontSize.sm}
            fontFamily="SEMI_BOLD"
            color={colors.primary.accent}
            onPress={() => {
              Linking.openURL("mailto:support@streetwriters.co");
            }}
          >
            support@streetwriters.co
          </Paragraph>
        </View>
      </View>

      <Pressable
        type="shade"
        style={{
          width: "100%",
          borderRadius: Radius.XS,
          paddingHorizontal: Spacing.LEVEL_2,
          paddingVertical: Spacing.LEVEL_1,
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.LEVEL_1,
          justifyContent: "flex-start"
        }}
        onPress={() => setAcknowledged((value) => !value)}
      >
        <AppIcon
          size={16}
          name={acknowledged ? "checkbox" : "box-empty"}
          iconFamily="notesnook"
          color={
            acknowledged
              ? [colors.primary.accent, "white"]
              : colors.primary.icon
          }
        />
        <Paragraph size={AppFontSize.sm}>
          {strings.forceSyncRiskAcknowledgement()}
        </Paragraph>
      </Pressable>

      <View
        style={{
          flexDirection: "row",
          gap: Spacing.LEVEL_2
        }}
      >
        <Button
          title={strings.cancel()}
          type="plain-outline"
          width="100%"
          style={{
            flex: 1,
            borderRadius: Radius.S
          }}
          onPress={() => close?.()}
        />

        <Button
          title={actionText}
          type="error"
          width="100%"
          disabled={!acknowledged}
          style={{
            flex: 1,
            borderRadius: Radius.S,
            borderColor: colors.error.border
          }}
          onPress={onForceSyncPress}
        />
      </View>
    </View>
  );
}

ForceSync.present = (mode: ForceSyncMode) => {
  presentSheet({
    disableClosing: false,
    component: (_ref, close) => <ForceSync mode={mode} close={close} />
  });
};

export default ForceSync;
