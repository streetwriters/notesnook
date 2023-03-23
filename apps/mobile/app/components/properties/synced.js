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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import { openLinkInBrowser } from "../../utils/functions";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
export const Synced = ({ item, close }) => {
  const colors = useThemeStore((state) => state.colors);
  const user = useUserStore((state) => state.user);
  const lastSynced = useUserStore((state) => state.lastSynced);

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
        borderTopColor: colors.nav
      }}
    >
      <Icon name="shield-key-outline" color={colors.accent} size={SIZE.xxxl} />

      <View
        style={{
          flex: 1,
          marginLeft: 5,
          flexShrink: 1
        }}
      >
        <Heading
          color={colors.heading}
          size={SIZE.xs}
          style={{
            flexWrap: "wrap"
          }}
        >
          Encrypted and synced
        </Heading>
        <Paragraph
          style={{
            flexWrap: "wrap"
          }}
          size={SIZE.xs}
          color={colors.pri}
        >
          No one can view this {item.itemType || item.type} except you.
        </Paragraph>
      </View>

      <Button
        onPress={async () => {
          try {
            close();
            await sleep(300);
            await openLinkInBrowser(
              "https://docs.notesnook.com/how-is-my-data-encrypted/",
              colors
            );
          } catch (e) {
            console.error(e);
          }
        }}
        fontSize={SIZE.xs + 1}
        title="Learn more"
        height={30}
        type="grayAccent"
      />
    </View>
  ) : null;
};
