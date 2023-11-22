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
  screen?: string;
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
                ? tip || ({ text: placeholder?.paragraph } as TTip)
                : ({ text: placeholder?.paragraph } as TTip)
            }
            style={{
              backgroundColor: "transparent",
              paddingHorizontal: 0
            }}
          />
          {placeholder?.button && (
            <Button
              testID={notesnook.buttons.add}
              type="grayAccent"
              title={placeholder?.button}
              iconPosition="right"
              icon="arrow-right"
              onPress={placeholder?.action}
              buttonType={{
                text: color || colors.primary.accent
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

/**
 * Make a tips manager.
 * The tip manager stores many tips. Each tip has following values
 * 1. Text
 * 2. contexts: An array of context strings. // Places where the tip can be shown
 * 3. Button if any.
 * 4. Image/Gif asset.
 *
 * Tip manager adds the following methods -> get(context). Returns a random tip for the following context.
 *
 * Tips can be shown in a sheet or in a list. For sheets, GeneralSheet can be used to
 * render tips.
 *
 * Where can the tips be shown and how?
 * 1. When transitioning, show tips in a sheet. Make sure its useful
 * 2. Replace placeholders with tips.
 * 3. Show tips in editor placeholder.
 * 4. Show tips between list items?
 *
 * Tooltips.
 * Small tooltips can be shown in initial render first time.
 * Especially for items that are not shown on blank page. Should be
 * in places where it makes sense and does not interrupt the user.
 *
 * Can also be shown when first time entering a screen that
 * has something that the user might not know of. Like sorting and side menu.
 *
 * Todo:
 * 1. Make a tip manager.
 * 2. Make a list of tips.
 * 3. Add images for those tips.
 * 4. Show tips
 */
