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

import { dataColor, Flex } from "@ui";
import type { ThemeMetadata } from "../theme-details-dialog";

type PreviewColors = { accent: string; paragraph: string; background: string };

export function ThemePreview(props: {
  theme: ThemeMetadata & { previewColors?: PreviewColors };
}) {
  const colors = props.theme.previewColors;
  if (!colors) return null;
  return (
    <Flex
      sx={{
        height: 200,
        borderRadius: "default",
        overflow: "hidden",
        border: "2px solid",
        borderColor: dataColor(colors.accent),
        bg: dataColor(colors.background),
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        p: 1,
        gap: 1
      }}
    >
      {[colors.accent, colors.paragraph, colors.background].map((color, i) => (
        <Flex
          key={`${color}-${i}`}
          sx={{
            width: 18,
            height: 18,
            borderRadius: 9,
            bg: dataColor(color),
            border: "1px solid",
            borderColor: "border"
          }}
        />
      ))}
    </Flex>
  );
}
