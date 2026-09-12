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
import { View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

type CirclesBackgroundProps = {
  /** Width & height of the (square) illustration. */
  size?: number;
  /** Centered content, usually an `AppIcon`. */
  children?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * A reusable concentric-circles illustration with an empty center slot.
 * Pass any icon/content via `children` to render it centered on the accent
 * circle. Adapts to light/dark themes.
 */
export const CirclesBackground = ({
  size = 100,
  children,
  style
}: CirclesBackgroundProps) => {
  const { colors, isDark } = useThemeColors();
  const accent = colors.primary.accent;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center"
        },
        style
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 233 233" fill="none">
        <Circle
          cx={116.5}
          cy={116.5}
          r={104.75}
          stroke={isDark ? "#1F2722" : "#E8F4ED"}
          strokeWidth={0.5}
        />
        <Circle
          cx={116.5}
          cy={116.5}
          r={95.25}
          fill={accent}
          fillOpacity={0.05}
          stroke={isDark ? "#233C2D" : "#E8F0EC"}
          strokeWidth={0.5}
        />
        <Circle
          cx={116.5}
          cy={116.5}
          r={82.25}
          fill={accent}
          fillOpacity={0.04}
          stroke={isDark ? "#233C2D" : "#E3F1E8"}
          strokeWidth={0.5}
        />
        <Circle
          cx={116.5}
          cy={116.5}
          r={62.25}
          fill={accent}
          fillOpacity={0.06}
          stroke={isDark ? "#233C2D" : "#D3E8DB"}
          strokeWidth={0.5}
        />
        <Circle cx={116.5} cy={116.5} r={44.5} fill={accent} />
      </Svg>

      {children ? (
        <View
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
};

export default CirclesBackground;
