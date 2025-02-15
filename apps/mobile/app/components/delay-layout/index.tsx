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
import { ViewProps } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { useDelayLayout } from "../../hooks/use-delay-layout";
import { DefaultPlaceholder } from "./default-placeholder";
import { SettingsPlaceholder } from "./settings-placeholder";

interface IDelayLayoutProps extends ViewProps {
  delay?: number;
  wait?: boolean;
  type?: "default" | "settings";
  color?: string;
  animated?: boolean;
}

const placeholder = {
  default: DefaultPlaceholder,
  settings: SettingsPlaceholder
};

export default function DelayLayout({
  animated = true,
  ...props
}: IDelayLayoutProps) {
  const { colors } = useThemeColors();
  const loading = useDelayLayout(
    !props.delay || props.delay < 300 ? 0 : props.delay
  );
  const Placeholder = placeholder[props.type || "default"];

  return loading || props.wait ? (
    <Animated.View
      exiting={animated ? FadeOut : undefined}
      style={{
        backgroundColor: colors.primary.background,
        flex: 1,
        paddingTop: 20
      }}
    >
      <Placeholder color={props.color || colors.primary.accent} />
    </Animated.View>
  ) : (
    <>{props.children}</>
  );
}
