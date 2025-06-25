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
import React, { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { eScrollEvent } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import Tag from "../ui/tag";
import Heading from "../ui/typography/heading";

export const Title = ({
  title,
  isHiddenOnRender,
  accentColor,
  isBeta,
  renderedInRoute,
  id
}: {
  title: string;
  isHiddenOnRender?: boolean;
  accentColor?: string;
  isBeta?: boolean;
  renderedInRoute?: string;
  id?: string;
}) => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(isHiddenOnRender);
  const isTag = title.startsWith("#");
  const onScroll = useCallback(
    (data: { x: number; y: number; id?: string; route: string }) => {
      if (data.route !== "Notebook") return;

      if (data.route !== renderedInRoute || data.id !== id) return;
      if (data.y > 150) {
        if (!visible) return;
        setVisible(false);
      } else {
        if (visible) return;
        setVisible(true);
      }
    },
    [id, renderedInRoute, visible]
  );

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [visible, onScroll]);

  return (
    <>
      {!visible ? (
        <Heading
          numberOfLines={1}
          size={AppFontSize.lg}
          style={{
            flexWrap: "wrap",
            marginTop: Platform.OS === "ios" ? -1 : 0
          }}
          color={accentColor || colors.primary.heading}
        >
          {isTag ? (
            <Heading size={AppFontSize.xl} color={colors.primary.accent}>
              #
            </Heading>
          ) : null}
          {isTag ? title.slice(1) : title}{" "}
          <Tag
            visible={isBeta}
            text="BETA"
            style={{
              backgroundColor: "transparent"
            }}
            textColor={colors.primary.accent}
          />
        </Heading>
      ) : null}
    </>
  );
};
