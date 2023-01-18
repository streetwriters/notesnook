/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import { useEffect, useState } from "react";
import Config from "../../utils/config";
import DropdownButton from "../dropdown-button";

export function DefaultFont() {
  const fonts = ["sans-serif", "serif", "monoSpace"];
  const getOptions = () =>
    Config.get("fontFamily", fonts).map((font) => ({
      title: () => capitalizeFirstLetter(font),
      onClick: () => {
        const newFonts = [font];
        for (const item of fonts) {
          if (item !== font) {
            newFonts.push(item);
          }
        }
        Config.set("fontFamily", newFonts);
        setOptions(getOptions());
      },
      key: font
    }));
  const [fontSize, setFontSize] = useState(Config.get("fontSize", 16));
  const [options, setOptions] = useState(getOptions());
  useEffect(() => {
    console.log("options changed");
  }, [options]);

  return (
    <Flex sx={{ justifyContent: "space-evenly", flexWrap: "wrap" }}>
      <Flex sx={{ flex: 3, minWidth: 100 }}>
        <Slider
          min={8}
          max={120}
          defaultValue={fontSize}
          step={1}
          onChange={(e) => {
            setFontSize(parseInt(e.target.value));
            Config.set("fontSize", parseInt(e.target.value));
          }}
          sx={{ width: "75%" }}
        />
        <Text
          sx={{
            width: "25%",
            fontSize: "12px",
            textAlign: "center"
          }}
        >
          {`${fontSize}px`}
        </Text>
      </Flex>
      <DropdownButton
        options={options}
        title="Font Family"
        sx={{
          flex: 1,
          minWidth: 100
        }}
        buttonStyle={{
          width: "80%"
        }}
        chevronStyle={{
          width: "20%"
        }}
      />
    </Flex>
  );
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
