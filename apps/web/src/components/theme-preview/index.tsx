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

import { alpha } from "@theme-ui/color";
import { Box, Flex } from "@theme-ui/components";
import { ThemeMetadata } from "@notesnook/themes-server";
import { ReactNode } from "react";

export type ThemePreviewProps = {
  theme: ThemeMetadata;
  /**
   * Rendered in the bottom-right of the wireframe window in place of the
   * three colour dots.
   */
  badge?: ReactNode;
  selected?: boolean;
  /** Total height of the preview frame. */
  height?: number;
  /** Top offset of the wireframe window inside the frame. */
  windowTop?: number;
  /** Height of the wireframe window. */
  windowHeight?: number;
};

export function ThemePreview(props: ThemePreviewProps) {
  const {
    theme,
    badge,
    selected,
    height = 239,
    windowTop = 23,
    windowHeight = 193
  } = props;
  const colors = theme.previewColors;
  const line = alpha(colors.paragraph, 0.2);
  const strongLine = alpha(colors.paragraph, 0.45);
  const bar = {
    position: "absolute",
    height: "3.797px",
    borderRadius: "10px"
  } as const;

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height,
        bg: "background",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "radius3",
        boxShadow: `0px 4px 17px 0px rgba(0, 0, 0, ${selected ? 0.07 : 0.05})`
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: "8.61%",
          top: windowTop,
          width: "82.56%",
          height: windowHeight,
          borderRadius: "10px",
          overflow: "hidden"
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "28.7%",
            bg: colors.navigationMenu.background
          }}
        >
          <Box
            sx={{
              ...bar,
              left: "9.25%",
              top: "11.39px",
              width: "37.04%",
              bg: colors.navigationMenu.accent
            }}
          />
          <Box
            sx={{
              ...bar,
              left: "9.25%",
              top: "17.72px",
              width: "46.3%",
              bg: line
            }}
          />
          <Box
            sx={{
              ...bar,
              left: "9.25%",
              top: "24.05px",
              width: "46.3%",
              bg: line
            }}
          />
          <Box
            sx={{
              ...bar,
              left: "9.25%",
              top: "30.38px",
              width: "37.04%",
              bg: line
            }}
          />
        </Box>
        <Box
          sx={{
            position: "absolute",
            left: "28.7%",
            top: 0,
            right: 0,
            bottom: 0,
            bg: colors.list.background,
            borderLeft: "1px solid",
            borderLeftColor: colors.border
          }}
        >
          <Box
            sx={{
              ...bar,
              left: "10.9%",
              top: "11.39px",
              width: "14.92%",
              bg: strongLine
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: "90.47%",
              top: "10.13px",
              width: "4.58%",
              aspectRatio: "8.985 / 4.8125",
              borderRadius: "10px",
              bg: strongLine
            }}
          />
          <Box
            sx={{
              ...bar,
              left: "10.9%",
              top: "21.52px",
              width: "68.37%",
              bg: line
            }}
          />
          <Box
            sx={{
              ...bar,
              left: "10.9%",
              top: "27.84px",
              width: "68.37%",
              bg: line
            }}
          />
          <Box
            sx={{
              ...bar,
              left: "10.9%",
              top: "34.17px",
              width: "54.69%",
              bg: line
            }}
          />
        </Box>
        {badge ? (
          <Flex
            sx={{
              position: "absolute",
              right: "1.6%",
              bottom: "12px",
              alignItems: "center",
              justifyContent: "center",
              p: "4px",
              fontFamily: "body",
              fontSize: "3xs",
              lineHeight: 1,
              color: colors.paragraph,
              bg: alpha(colors.paragraph, 0.08),
              borderRadius: "10px"
            }}
          >
            {badge}
          </Flex>
        ) : (
          <Flex
            sx={{
              position: "absolute",
              right: "3.57%",
              bottom: "11px"
            }}
          >
            {[colors.accent, colors.paragraph, colors.background].map(
              (color, index) => (
                <Box
                  key={index.toString()}
                  sx={{
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    borderRadius: "50%",
                    bg: color,
                    // keeps a dot visible when it matches the window background
                    border: `1px solid ${colors.border}`,
                    ml: index === 0 ? 0 : "-13px"
                  }}
                />
              )
            )}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
