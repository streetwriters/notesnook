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

import type { SxProp } from "./style";
import { Box, Button, Flex, Input, Text, ThemeScope } from "./primitives";

export const valid: SxProp = {
  display: "flex",
  flexDirection: ["column", "row"],
  alignItems: "center",
  p: 2,
  mt: "spacing3",
  bg: "background-secondary",
  color: "paragraph",
  borderRadius: "default",
  border: "1px solid",
  fontSize: "body",
  ":hover": { bg: "hover", borderColor: "border" },
  ":group-hover": { group: "row", style: { opacity: 1 } }
};

export const selector: SxProp = {
  // @ts-expect-error selectors are not part of the contract
  "&:hover svg path": { fill: "icon" }
};

export const classSelector: SxProp = {
  // @ts-expect-error class selectors are not part of the contract
  ".active": { color: "accent" }
};

export const nestedState: SxProp = {
  // @ts-expect-error only the listed state keys exist
  ":first-of-type": { color: "accent" }
};

export const mediaQuery: SxProp = {
  // @ts-expect-error responsive values are arrays, not media queries
  "@media (max-width: 480px)": { display: "none" }
};

export const cssVariable: SxProp = {
  // @ts-expect-error raw CSS variables are not tokens
  color: "var(--paragraph)"
};

export const unknownToken: SxProp = {
  // @ts-expect-error not a theme colour
  bg: "not-a-theme-color"
};

export const unsupportedUnit: SxProp = {
  // @ts-expect-error rem is not a supported unit
  width: "10rem"
};

export const unsupportedDisplay: SxProp = {
  // @ts-expect-error only flex and none are display values
  display: "block"
};

export const stateWithLayout: SxProp = {
  // @ts-expect-error state styles only change visual properties
  ":hover": { width: 10 }
};

export const elements = [
  <Box key="1" sx={valid} bg="background" p={2} />,
  <Flex key="2" mt={1} />,
  <Text key="3" variant="body" color="paragraph" />,
  <Button key="4" variant="accent" onPress={(e) => e.stopPropagation()} />,
  <Input key="5" onChangeText={(text) => text.length} />,
  <ThemeScope key="6" scope="navigationMenu" />,
  // @ts-expect-error className is not part of the contract
  <Box key="7" className="selectable" />,
  // @ts-expect-error inline style is not part of the contract
  <Box key="8" style={{ flex: 1 }} />,
  // @ts-expect-error raw colour strings are not tokens
  <Box key="9" bg="#ff0000" />
];
