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

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import useKeyboard from "../../hooks/use-keyboard";
import { DDS } from "../../services/device-detection";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { getElevationStyle } from "../../utils/elevation";
import {
  eCloseActionSheet,
  eCloseSheet,
  eOpenPremiumDialog,
  eShowGetPremium
} from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export const PremiumToast = ({ context = "global", offset = 0 }) => {
  const { colors } = useThemeColors();
  const [msg, setMsg] = useState(null);
  const timer = useRef();
  const keyboard = useKeyboard();

  const open = useCallback(
    (event) => {
      if (!event) {
        clearTimeout(timer);
        timer.current = null;
        setMsg(null);
        return;
      }

      if (event.context === context && msg?.desc !== event.desc) {
        if (timer.current !== null) {
          clearTimeout(timer.current);
          timer.current = null;
        }
        setMsg(event);
        timer.current = setTimeout(async () => {
          setMsg(null);
        }, 3000);
      }
    },
    [context, msg?.desc]
  );

  useEffect(() => {
    eSubscribeEvent(eShowGetPremium, open);
    return () => {
      eUnSubscribeEvent(eShowGetPremium, open);
    };
  }, [open]);

  const onPress = async () => {
    open(null);
    eSendEvent(eCloseActionSheet);
    eSendEvent(eCloseSheet);
    await sleep(300);
    eSendEvent(eOpenPremiumDialog);
  };

  return (
    !!msg && (
      <Animated.View
        entering={FadeInUp}
        exiting={FadeOutUp}
        style={{
          position: "absolute",
          backgroundColor: colors.secondary.background,
          zIndex: 999,
          ...getElevationStyle(20),
          padding: 12,
          borderRadius: 10,
          flexDirection: "row",
          alignSelf: "center",
          justifyContent: "space-between",
          top: offset + keyboard.keyboardHeight,
          maxWidth: DDS.isLargeTablet() ? 400 : "98%"
        }}
        onTouchEnd={() => {
          setMsg(null);
          clearTimeout(timer.current);
        }}
      >
        <View
          style={{
            flexShrink: 1,
            flexGrow: 1,
            paddingRight: 6
          }}
        >
          <Heading
            style={{
              flexWrap: "wrap"
            }}
            color={colors.primary.accent}
            size={AppFontSize.md}
          >
            {msg.title}
          </Heading>

          <Paragraph
            style={{
              flexWrap: "wrap"
            }}
            size={AppFontSize.sm}
            color={colors.primary.paragraph}
          >
            {msg.desc}
          </Paragraph>
        </View>

        <Button onPress={onPress} title="Get Now" type="accent" />
      </Animated.View>
    )
  );
};
