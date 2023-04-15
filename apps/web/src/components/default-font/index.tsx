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

import { Flex, Slider, Text } from "@theme-ui/components";
import { useState } from "react";
import { useStore as useEditorStore } from "../../stores/editor-store";
import Config from "../../utils/config";
import { toTitleCase } from "../../utils/string";
import DropdownButton from "../dropdown-button";

export function DefaultFont() {
  return null;
  // const fontSize = useEditorStore((store) => store.session.fontSize);
  //const fontFamily = useEditorStore((store) => store.session.fontFamily);

  // const fonts = ["sans-serif", "serif", "monospace"];
  // const getOptions = () =>
  //   getFonts(Config.get("fontFamily", "sans-serif")).map((font) => ({
  //     title: () => toTitleCase(font),
  //     onClick: () => {
  //       const newFonts = [font];
  //       for (const item of fonts) {
  //         if (item !== font) {
  //           newFonts.push(item);
  //         }
  //       }
  //       Config.set("fontFamily", font);
  //       setFontFamily(font);
  //       setOptions(getOptions());
  //     },
  //     key: font
  //   }));

  // const [options, setOptions] = useState(getOptions());

  // return (
  //   <Flex sx={{ justifyContent: "space-evenly", flexWrap: "wrap" }}>
  //     <Flex sx={{ flex: 3, minWidth: 100 }}>
  //       <Slider
  //         min={8}
  //         max={120}
  //         defaultValue={parseInt(fontSize.replace("px", ""))}
  //         step={1}
  //         onChange={(e) => {
  //           setFontSize(`${parseInt(e.target.value)}px`);
  //           Config.set("fontSize", `${e.target.value}px`);
  //         }}
  //         sx={{ width: "75%" }}
  //       />
  //       <Text
  //         sx={{
  //           width: "25%",
  //           fontSize: "12px",
  //           textAlign: "center"
  //         }}
  //       >
  //         {fontSize}
  //       </Text>
  //     </Flex>
  //     <DropdownButton
  //       options={options}
  //       title="Font Family"
  //       sx={{
  //         flex: 1,
  //         minWidth: 100
  //       }}
  //       buttonStyle={{
  //         width: "80%"
  //       }}
  //       chevronStyle={{
  //         width: "20%"
  //       }}
  //     />
  //   </Flex>
  // );
}

function getFonts(font: string) {
  const fonts = [font];
  const defaultFonts = ["sans-serif", "serif", "monospace"];
  for (const _font of defaultFonts) {
    if (_font !== font) {
      fonts.push(_font);
    }
  }
  return fonts;
}
