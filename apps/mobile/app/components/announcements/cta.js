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
import { Linking, View } from "react-native";
//import SettingsBackupAndRestore from '../../screens/settings/backup-restore';
import { useThemeColors } from "@notesnook/theme";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import { eCloseAnnouncementDialog } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import { PricingPlans } from "../premium/pricing-plans";
import SheetProvider from "../sheet-provider";
import { Button } from "../ui/button";
import { allowedOnPlatform, getStyle } from "./functions";

export const Cta = ({ actions, style = {}, color, inline }) => {
  const { colors } = useThemeColors();
  let buttons =
    actions.filter((item) => allowedOnPlatform(item.platforms)) || [];

  const onPress = async (item) => {
    if (!inline) {
      eSendEvent(eCloseAnnouncementDialog);
      await sleep(500);
    }
    if (item.type === "link") {
      Linking.openURL(item.data).catch(() => {
        /* empty */
      });
    } else if (item.type === "promo") {
      presentSheet({
        component: (
          <PricingPlans
            marginTop={1}
            promo={{
              promoCode: item.data,
              text: item.title
            }}
          />
        )
      });
    }
  };
  return (
    <View
      style={{
        paddingHorizontal: 12,
        ...getStyle(style),
        flexDirection: inline ? "row" : "column"
      }}
    >
      <SheetProvider context="premium_cta" />

      {inline ? (
        <>
          {buttons.length > 0 &&
            buttons.slice(0, 1).map((item) => (
              <Button
                key={item.title}
                title={item.title}
                fontSize={AppFontSize.sm}
                type="transparent"
                textStyle={{
                  textDecorationLine: "underline"
                }}
                onPress={() => onPress(item)}
                bold
                style={{
                  height: 30,
                  alignSelf: "flex-start",
                  paddingHorizontal: 0
                }}
              />
            ))}

          {buttons.length > 1 &&
            buttons.slice(1, 2).map((item) => (
              <Button
                key={item.title}
                title={item.title}
                fontSize={AppFontSize.sm}
                type="plain"
                onPress={() => onPress(item)}
                width={null}
                height={30}
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 0,
                  marginLeft: 12
                }}
                textStyle={{
                  textDecorationLine: "underline"
                }}
              />
            ))}
        </>
      ) : (
        <>
          {buttons.length > 0 &&
            buttons.slice(0, 1).map((item) => (
              <Button
                key={item.title}
                title={item.title}
                fontSize={AppFontSize.md}
                buttonType={{
                  color: color ? color : colors.primary.accent,
                  text: color
                    ? colors.static.white
                    : colors.primary.accentForeground,
                  selected: color ? color : colors.primary.accent,
                  opacity: 1
                }}
                onPress={() => onPress(item)}
                width={250}
                style={{
                  marginBottom: 5,
                  borderRadius: 100
                }}
              />
            ))}

          {buttons.length > 1 &&
            buttons.slice(1, 2).map((item) => (
              <Button
                key={item.title}
                title={item.title}
                fontSize={AppFontSize.xs}
                type="plain"
                onPress={() => onPress(item)}
                width={null}
                height={30}
                style={{
                  minWidth: "50%",
                  marginTop: 5
                }}
                textStyle={{
                  textDecorationLine: "underline"
                }}
              />
            ))}
        </>
      )}
    </View>
  );
};
