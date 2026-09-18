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
import React from "react";
import { Image, View, ViewStyle } from "react-native";
import { Radius, Spacing } from "../../../common/design/spacing";
import AppIcon from "../../../components/ui/AppIcon";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import { useUserStore } from "../../../stores/use-user-store";
import { getObfuscatedEmail } from "../../../utils/functions";

type AccountCardProps = {
  style?: ViewStyle;
};

export const AccountCard = ({ style }: AccountCardProps) => {
  const { colors } = useThemeColors();
  const [user, profile] = useUserStore((state) => [state.user, state.profile]);

  const fullName = profile?.fullName || strings.account();
  const email = user?.email ? getObfuscatedEmail(user.email) : "";

  return (
    <View
      style={{
        paddingHorizontal: Spacing.LEVEL_3
      }}
    >
      <View
        style={[
          {
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_1,
            padding: Spacing.LEVEL_2,
            borderRadius: Radius.S,
            backgroundColor: colors.primary.shade
          },
          style
        ]}
      >
        {profile?.profilePicture ? (
          <Image
            source={{
              uri: profile.profilePicture
            }}
            style={{
              width: 50,
              height: 50,
              borderRadius: Radius.XXL
            }}
          />
        ) : (
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: Radius.XXL,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondary.background
            }}
          >
            <AppIcon
              name="user"
              iconFamily="notesnook"
              size={18}
              color={colors.secondary.icon}
            />
          </View>
        )}

        <View
          style={{
            flex: 1,
            gap: Spacing.LEVEL_1
          }}
        >
          <Heading fontSize="LG" fontFamily="SEMI_BOLD" lineHeight="100%">
            {fullName}
          </Heading>

          {email ? (
            <Paragraph
              fontSize="SM"
              lineHeight="100%"
              color={colors.primary.paragraph}
            >
              {email}
            </Paragraph>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default AccountCard;
