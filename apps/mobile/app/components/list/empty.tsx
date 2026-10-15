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
import { ActivityIndicator, View } from "react-native";
import { notesnook } from "../../../e2e/test.ids";
import { Spacing } from "../../common/design/spacing";
import { RouteParams } from "../../stores/use-navigation-store";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export type PlaceholderData = {
  title: string;
  paragraph: string;
  button?: string;
  action?: () => void;
  loading?: string;
  type?: string;
};

type EmptyListProps = {
  loading?: boolean;
  placeholder?: PlaceholderData;
  title?: string;
  color?: string;
  dataType: string;
  screen?: keyof RouteParams;
};

export const Empty = React.memo(function Empty({
  loading = true,
  placeholder,
  title,
  color,
  dataType,
  screen
}: EmptyListProps) {
  const { colors } = useThemeColors();

  return (
    <View
      style={[
        {
          flex: 1,
          width: "100%",
          justifyContent: "center",
          alignSelf: "center"
        }
      ]}
    >
      {!loading ? (
        <>
          <View
            style={{
              alignItems: "center",
              gap: Spacing.LEVEL_1
            }}
          >
            <Heading size={AppFontSize.md} color={colors.primary.heading}>
              {placeholder?.title}
            </Heading>
            <Paragraph
              style={{
                textAlign: "center",
                marginBottom: Spacing.LEVEL_2,
                maxWidth: "80%"
              }}
              fontSize="SM"
              color={colors.primary.paragraph}
            >
              {placeholder?.paragraph}
            </Paragraph>

            {placeholder?.button && (
              <Button
                testID={notesnook.buttons.add}
                type="accent"
                title={placeholder?.button}
                iconPosition="right"
                onPress={placeholder?.action}
              />
            )}
          </View>
        </>
      ) : (
        <>
          <View
            style={{
              alignSelf: "center",
              alignItems: "center",
              width: "100%",
              gap: Spacing.LEVEL_2
            }}
          >
            <ActivityIndicator
              size={AppFontSize.lg}
              color={color || colors.primary.accent}
            />
            <Paragraph>{placeholder?.loading}</Paragraph>
          </View>
        </>
      )}
    </View>
  );
});
