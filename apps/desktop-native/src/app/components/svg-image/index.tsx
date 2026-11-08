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

import { useMemo } from "react";
import { getThemeScope } from "@notesnook/theme";
import { Flex, Icon, Image, type SxProp } from "@ui";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { svgAssets, type SvgAssetName } from "../../assets/svg.generated";
import {
  rasterAssets,
  type RasterAssetName
} from "../../assets/raster.generated";

function useThemeVariables() {
  const theme = useThemeStore((store) =>
    store.colorScheme === "dark" ? store.darkTheme : store.lightTheme
  );
  return useMemo(() => {
    const variables: Record<string, string> = {};
    const { colors } = getThemeScope("base", theme);
    for (const [variant, group] of Object.entries(colors)) {
      if (typeof group !== "object" || !group) continue;
      const suffix = variant === "primary" ? "" : `-${variant}`;
      for (const [name, value] of Object.entries(group))
        if (typeof value === "string") variables[`${name}${suffix}`] = value;
    }
    return variables;
  }, [theme]);
}

export function resolveSvgVariables(
  xml: string,
  variables: Record<string, string>
) {
  return xml.replace(
    /var\(--([a-z-]+)\)/g,
    (_, name: string) => variables[name] ?? "currentColor"
  );
}

type SvgImageProps = {
  name: SvgAssetName;
  width: number;
  height: number;
  sx?: SxProp;
  testID?: string;
};

export function SvgImage(props: SvgImageProps) {
  const { name, width, height, sx, testID } = props;
  const variables = useThemeVariables();
  const xml = useMemo(
    () => resolveSvgVariables(svgAssets[name], variables),
    [name, variables]
  );

  return (
    <Flex
      testID={testID}
      sx={{
        width,
        height,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...sx
      }}
    >
      <Icon svg={xml} size={Math.max(width, height)} />
    </Flex>
  );
}

type RasterImageProps = {
  name: RasterAssetName;
  width: number;
  height: number;
  resizeMode?: "cover" | "contain" | "stretch";
  sx?: SxProp;
  testID?: string;
};

export function RasterImage(props: RasterImageProps) {
  const { name, width, height, resizeMode = "contain", sx, testID } = props;
  return (
    <Image
      testID={testID}
      src={rasterAssets[name]}
      resizeMode={resizeMode}
      sx={{ width, height, flexShrink: 0, ...sx }}
    />
  );
}
