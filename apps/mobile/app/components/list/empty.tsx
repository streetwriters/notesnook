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
import { ActivityIndicator, useWindowDimensions, View } from "react-native";
import { notesnook } from "../../../e2e/test.ids";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { TTip, useTip } from "../../services/tip-manager";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE } from "../../utils/size";
import { Tip } from "../tip";
import { Button } from "../ui/button";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { RouteParams } from "../../stores/use-navigation-store";

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
  const insets = useGlobalSafeAreaInsets();
  const { height } = useWindowDimensions();
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );
  const tip = useTip(
    screen === "Notes" && introCompleted
      ? "first-note"
      : placeholder?.type || ((dataType + "s") as any),
    screen === "Notes" ? "notes" : "list"
  );

  return (
    <View
      style={[
        {
          height: height - (140 + insets.top),
          width: "80%",
          justifyContent: "center",
          alignSelf: "center"
        }
      ]}
    >
      {!loading ? (
        <>
          <Tip
            color={color}
            tip={
              screen !== "Search"
                ? tip || ({ text: () => placeholder?.paragraph } as TTip)
                : ({ text: () => placeholder?.paragraph } as TTip)
            }
            style={{
              backgroundColor: "transparent",
              paddingHorizontal: 0
            }}
          />
          {placeholder?.button && (
            <Button
              testID={notesnook.buttons.add}
              type="accent"
              title={placeholder?.button}
              iconPosition="right"
              icon="arrow-right"
              onPress={placeholder?.action}
              buttonType={{
                text: "white"
              }}
              style={{
                alignSelf: "flex-start",
                borderRadius: 5,
                height: 40
              }}
            />
          )}
        </>
      ) : (
        <>
          <View
            style={{
              alignSelf: "center",
              alignItems: "flex-start",
              width: "100%"
            }}
          >
            <Heading>{placeholder?.title}</Heading>
            <Paragraph size={SIZE.sm} textBreakStrategy="balanced">
              {placeholder?.loading}
            </Paragraph>
            <Seperator />
            <ActivityIndicator
              size={SIZE.lg}
              color={color || colors.primary.accent}
            />
          </View>
        </>
      )}
    </View>
  );
});
