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
import { View, useWindowDimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useUserStore } from "../../stores/use-user-store";
import { openLinkInBrowser } from "../../utils/functions";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
export const Synced = ({ item, close }) => {
  const { colors } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const lastSynced = useUserStore((state) => state.lastSynced);

  const dimensions = useWindowDimensions();
  const shouldShrink = dimensions.fontScale > 1 && dimensions.width < 450;
  return user && lastSynced >= item.dateModified ? (
    <View
      style={{
        paddingVertical: 0,
        width: "100%",
        paddingHorizontal: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignSelf: "center",
        paddingTop: 10,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.primary.border
      }}
    >
      <Icon
        name="shield-key-outline"
        color={colors.primary.accent}
        size={shouldShrink ? SIZE.xxl : SIZE.xxxl}
      />

      <View
        style={{
          flex: 1,
          marginLeft: 5,
          flexShrink: 1
        }}
      >
        <Heading
          color={colors.primary.heading}
          size={SIZE.xs}
          style={{
            flexWrap: "wrap"
          }}
        >
          {strings.noteSyncedNoticeHeading()}
        </Heading>
        {shouldShrink ? null : (
          <Paragraph
            style={{
              flexWrap: "wrap"
            }}
            size={SIZE.xs}
            color={colors.primary.paragraph}
          >
            {strings.noteSyncedNoticeDesc(item.itemType || item.type)}
          </Paragraph>
        )}
      </View>

      <Button
        onPress={async () => {
          try {
            close();
            await sleep(300);
            await openLinkInBrowser(
              "https://help.notesnook.com/how-is-my-data-encrypted",
              colors
            );
          } catch (e) {
            console.error(e);
          }
        }}
        title={strings.learnMore()}
        fontSize={SIZE.xs}
        height={30}
        type="secondaryAccented"
      />
    </View>
  ) : null;
};
