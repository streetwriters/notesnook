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

import React, { useMemo } from "react";
import { Platform, Text, TextProps } from "react-native";
import Animated, {
  ComplexAnimationBuilder,
  Layout
} from "react-native-reanimated";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../../utils/size";
interface HeadingProps extends TextProps {
  color?: string;
  size?: number;
  layout?: ComplexAnimationBuilder;
  animated?: boolean;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

const Heading = ({
  color,
  size = SIZE.xl,
  style,
  animated,
  ...restProps
}: HeadingProps) => {
  const colors = useThemeColors();
  const Component = useMemo(() => (animated ? AnimatedText : Text), [animated]);

  return (
    <Component
      layout={restProps.layout || Layout}
      allowFontScaling={true}
      maxFontSizeMultiplier={1}
      {...restProps}
      style={[
        {
          fontSize: size || SIZE.xl,
          color: color || colors.primary.heading,
          fontFamily:
            Platform.OS === "android" ? "OpenSans-SemiBold" : undefined,
          fontWeight: Platform.OS === "ios" ? "600" : undefined
        },
        style
      ]}
    ></Component>
  );
};

export default Heading;
