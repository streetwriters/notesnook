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

import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
export const BouncingView = ({
  children,
  style,
  duration = 600,
  animated = true,
  initialScale = 0.9
}) => {
  const scale = useSharedValue(!animated ? 1 : initialScale);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: !animated ? 1 : scale.value
        }
      ]
    };
  });

  useEffect(() => {
    if (!animated) return;
    scale.value = initialScale;
    scale.value = withTiming(1, {
      duration: duration,
      easing: Easing.elastic(1)
    });
  }, [animated, duration, initialScale, scale]);

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};
