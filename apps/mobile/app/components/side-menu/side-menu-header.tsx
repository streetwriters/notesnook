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
import { Image, View } from "react-native";
import { NOTESNOOK_LOGO_SVG } from "../../assets/images/assets";
import { useUserStore } from "../../stores/use-user-store";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { UserSheet } from "../sheets/user";
import AppIcon from "../ui/AppIcon";
import { IconButton, IconButtonProps } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import { SvgView } from "../ui/svg";
import Heading from "../ui/typography/heading";
import { useSideBarDraggingStore } from "./dragging-store";

const SettingsIcon = () => {
  const { colors } = useThemeColors();
  const userProfile = useUserStore((state) => state.profile);

  return (
    <Pressable
      onPress={() => {
        if (useSideBarDraggingStore.getState().dragging) return;
        UserSheet.present();
      }}
      testID="sidemenu-settings-icon"
      style={{
        width: 40,
        height: 40
      }}
    >
      {userProfile?.profilePicture ? (
        <Image
          source={{
            uri: userProfile?.profilePicture
          }}
          style={{
            width: 25,
            height: 25,
            borderRadius: 100
          }}
        />
      ) : (
        <AppIcon
          name="cog-outline"
          color={colors.primary.icon}
          size={AppFontSize.lg}
        />
      )}
    </Pressable>
  );
};

export const SideMenuHeader = (props: { rightButtons?: IconButtonProps[] }) => {
  const { colors, isDark } = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.primary.border,
        paddingBottom: DefaultAppStyles.GAP,
        paddingHorizontal: DefaultAppStyles.GAP
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: DefaultAppStyles.GAP_SMALL,
          alignItems: "center"
        }}
      >
        <View
          style={{
            backgroundColor: "black",
            width: 28,
            height: 28,
            borderRadius: 10
          }}
        >
          <SvgView width={28} height={28} src={NOTESNOOK_LOGO_SVG} />
        </View>

        <Heading size={AppFontSize.lg}>Notesnook</Heading>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: DefaultAppStyles.GAP_SMALL
        }}
      >
        {props.rightButtons?.map((button, index) => (
          <IconButton
            key={index}
            {...button}
            style={{
              width: 28,
              height: 28
            }}
            color={colors.primary.icon}
            size={AppFontSize.lg}
          />
        ))}

        <SettingsIcon />
      </View>
    </View>
  );
};
