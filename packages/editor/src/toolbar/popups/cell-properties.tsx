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

import { Editor } from "../../types";
import { Box } from "@theme-ui/components";
import { Tab, Tabs } from "../../components/tabs";
import { Icon } from "@notesnook/ui";
// import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { Icons } from "../icons";
import { ColorPicker } from "./color-picker";

type CellPropertiesProps = { editor: Editor; onClose: () => void };
export function CellProperties(props: CellPropertiesProps) {
  const { editor, onClose } = props;
  const attributes = editor.getAttributes("tableCell");
  return (
    <Popup title="Cell properties" onClose={onClose}>
      <Tabs activeIndex={0}>
        <Tab
          title={
            <Icon
              title="Cell background color"
              path={Icons.backgroundColor}
              size={16}
            />
          }
        >
          <Box mt={2} />
          <ColorPicker
            expanded={true}
            color={attributes.backgroundColor}
            onChange={(color) =>
              editor.current?.commands.setCellAttribute(
                "backgroundColor",
                color
              )
            }
            onClear={() =>
              editor.current?.commands.setCellAttribute(
                "backgroundColor",
                undefined
              )
            }
          />
        </Tab>
        <Tab
          title={
            <Icon title="Cell text color" path={Icons.textColor} size={16} />
          }
        >
          <Box mt={2} />
          <ColorPicker
            expanded={true}
            color={attributes.color}
            onChange={(color) =>
              editor.current?.commands.setCellAttribute("color", color)
            }
            onClear={() =>
              editor.current?.commands.setCellAttribute("color", undefined)
            }
          />
        </Tab>
        <Tab
          title={
            <Icon
              title="Cell border color"
              path={Icons.cellBorderColor}
              size={16}
            />
          }
        >
          <Box mt={2} />
          <ColorPicker
            expanded={true}
            color={attributes.borderColor}
            onChange={(color) =>
              editor.current?.commands.setCellAttribute("borderColor", color)
            }
            onClear={() =>
              editor.current?.commands.setCellAttribute(
                "borderColor",
                undefined
              )
            }
          />
        </Tab>
      </Tabs>
    </Popup>
  );
}
