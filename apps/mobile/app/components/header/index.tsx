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
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { RouteName } from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { eScrollEvent } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { IconButtonProps } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { LeftMenus } from "./left-menus";
import { RightMenus } from "./right-menus";

export const Header = ({
  renderedInRoute,
  onLeftMenuButtonPress,
  title,
  id,
  canGoBack,
  hasSearch,
  onSearch,
  rightButton
}: {
  onLeftMenuButtonPress?: () => void;
  renderedInRoute?: RouteName;
  id?: string;
  title: string;
  canGoBack?: boolean;
  onPressDefaultRightButton?: () => void;
  hasSearch?: boolean;
  onSearch?: () => void;
  rightButton?: IconButtonProps;
}) => {
  const { colors } = useThemeColors();
  const [borderHidden, setBorderHidden] = useState(true);
  const [selectedItemsList, selectionMode] = useSelectionStore((state) => [
    state.selectedItemsList,
    state.selectionMode
  ]);

  const onScroll = useCallback(
    (data: { x: number; y: number; id?: string; route: string }) => {
      if (data.route !== renderedInRoute || data.id !== id) return;
      if (data.y > 150) {
        if (!borderHidden) return;
        setBorderHidden(false);
      } else {
        if (borderHidden) return;
        setBorderHidden(true);
      }
    },
    [borderHidden, id, renderedInRoute]
  );

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [borderHidden, onScroll]);

  const HeaderWrapper = hasSearch ? Pressable : View;

  return (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP
      }}
    >
      <HeaderWrapper
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: DefaultAppStyles.GAP_SMALL,
          borderRadius: 10,
          paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
          borderWidth: hasSearch ? 1 : 0,
          borderColor: colors.secondary.border,
          paddingHorizontal: !hasSearch ? 0 : DefaultAppStyles.GAP_SMALL,
          alignItems: "center"
        }}
        onPress={() => {
          onSearch?.();
        }}
      >
        <LeftMenus
          canGoBack={canGoBack}
          onLeftButtonPress={onLeftMenuButtonPress}
        />

        {hasSearch ? (
          <Paragraph>
            {selectionMode
              ? `${selectedItemsList.length} selected`
              : strings.searchInRoute(title)}
          </Paragraph>
        ) : (
          <Heading size={AppFontSize.lg}>{title}</Heading>
        )}

        <RightMenus rightButton={rightButton} />
      </HeaderWrapper>
    </View>
  );
};
