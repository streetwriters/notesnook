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
import { View } from "react-native";
import { useThemeColors } from "@notesnook/theme";
import BaseDialog from "../../dialog/base-dialog";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import { useEffect } from "react";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { useState } from "react";
import { eCloseLoading, eOpenLoading } from "../../../utils/events";

export const LoadingDialog = () => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    eSubscribeEvent(eOpenLoading, open);
    eSubscribeEvent(eCloseLoading, close);
    return () => {
      eUnSubscribeEvent(eOpenLoading, open);
      eUnSubscribeEvent(eCloseLoading, close);
    };
  }, []);

  const open = () => setVisible(true);
  const close = () => setVisible(false);
  return (
    <BaseDialog
      animated={false}
      bounce={false}
      visible={visible}
      onRequestClose={undefined}
      onShow={undefined}
      premium={undefined}
      transparent={undefined}
    >
      <View
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: colors.primary.background,
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            width: 100,
            marginTop: 15
          }}
        >
          <ProgressBarComponent
            height={5}
            width={100}
            animated={true}
            useNativeDriver
            indeterminate
            indeterminateAnimationDuration={2000}
            unfilledColor={colors.secondary.background}
            color={colors.primary.accent}
            borderWidth={0}
          />
        </View>
      </View>
    </BaseDialog>
  );
};
