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

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { DDS } from "../../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { getElevationStyle } from "../../../utils/elevation";
import { eCloseResultDialog, eOpenResultDialog } from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import BaseDialog from "../../dialog/base-dialog";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { ProFeatures } from "./pro-features";

const ResultDialog = () => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [dialogData, setDialogData] = useState({
    title: "",
    paragraph: "",
    button: ""
  });
  useEffect(() => {
    eSubscribeEvent(eOpenResultDialog, open);
    eSubscribeEvent(eCloseResultDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenResultDialog, open);
      eUnSubscribeEvent(eCloseResultDialog, close);
    };
  }, []);

  const open = (data) => {
    if (data) {
      setDialogData(data);
    }
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return !visible ? null : (
    <BaseDialog visible={true} onRequestClose={close}>
      <View
        style={{
          ...getElevationStyle(5),
          width: DDS.isTab ? 350 : "85%",
          maxHeight: 500,
          borderRadius: 10,
          backgroundColor: colors.primary.background,
          paddingTop: 20,
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Heading
          size={AppFontSize.lg}
          textBreakStrategy="balanced"
          style={{
            alignSelf: "center",
            textAlign: "center",
            marginTop: 10,
            maxWidth: "100%",
            marginBottom: 10,
            paddingHorizontal: 12
          }}
        >
          {dialogData.title}
        </Heading>

        <Paragraph
          color={colors.secondary.paragraph}
          size={AppFontSize.md}
          style={{
            alignSelf: "center",
            textAlign: "center",
            maxWidth: "80%",
            lineHeight: AppFontSize.sm + 5
          }}
        >
          {dialogData.paragraph}
        </Paragraph>

        <Seperator />

        <View
          style={{
            paddingHorizontal: 12,
            alignItems: "center",
            width: "100%"
          }}
        >
          <ProFeatures count={4} />
        </View>

        <Seperator />
        <View
          style={{
            backgroundColor: colors.secondary.background,
            width: "100%",
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
            paddingVertical: 10
          }}
        >
          <Button
            title={dialogData.button}
            width={null}
            style={{
              paddingHorizontal: 12
            }}
            onPress={close}
            fontSize={AppFontSize.md + 2}
          />
        </View>
      </View>
    </BaseDialog>
  );
};

export default ResultDialog;
