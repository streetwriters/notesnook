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
import { View } from "react-native";
import { useMessageStore } from "../../stores/use-message-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { allowedOnPlatform, renderItem } from "./functions";
import { getContainerBorder } from "../../utils/colors";
import { DefaultAppStyles } from "../../utils/styles";
import Heading from "../ui/typography/heading";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import { strings } from "@notesnook/intl";

export const Announcement = () => {
  const { colors } = useThemeColors();
  const [announcements, remove] = useMessageStore((state) => [
    state.announcements,
    state.remove
  ]);
  let announcement = announcements.length > 0 ? announcements[0] : null;
  const selectionMode = useSelectionStore((state) => state.selectionMode);

  return !announcement || selectionMode ? null : (
    <View
      style={{
        backgroundColor: colors.primary.background,
        width: "100%",
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingVertical: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      <View
        style={{
          width: "100%",
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: colors.secondary.background,
          paddingBottom: 12,
          ...getContainerBorder(colors.secondary.background)
        }}
      >
        <View
          style={{
            width: "100%",
            marginTop: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: DefaultAppStyles.GAP,
              borderBottomWidth: 1,
              borderBottomColor: colors.primary.border,
              paddingBottom: DefaultAppStyles.GAP_VERTICAL_SMALL
            }}
          >
            <Heading color={colors.secondary.heading} size={AppFontSize.xxs}>
              {strings.announcement()}
            </Heading>

            <Button
              type="plain"
              icon="close"
              onPress={() => {
                remove(announcement.id);
              }}
              iconSize={20}
              fontSize={AppFontSize.xs}
              style={{
                paddingVertical: 0,
                paddingHorizontal: 0,
                zIndex: 10
              }}
            />
          </View>

          {announcement?.body
            .filter((item) => allowedOnPlatform(item.platforms))
            .map((item, index) =>
              renderItem({
                item: item,
                index: index,
                inline: true
              })
            )}
        </View>
      </View>
    </View>
  );
};
