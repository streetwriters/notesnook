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

import { Editor } from "../../types.js";
import { Box } from "@theme-ui/components";
import { Tab, Tabs } from "../../components/tabs/index.js";
import { Icon } from "@notesnook/ui";
// import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup.js";
import { Icons } from "../icons.js";
import { ColorPicker } from "./color-picker.js";
import { strings } from "@notesnook/intl";

type CellPropertiesProps = { editor: Editor; onClose: () => void };
export function CellProperties(props: CellPropertiesProps) {
  const { editor, onClose } = props;
  const attributes = editor.getAttributes("tableCell");
  return (
    <Popup title={strings.cellProperties()} onClose={onClose}>
      <Tabs activeIndex={0}>
        <Tab
          title={
            <Icon
              title={strings.cellBackgroundColor()}
              path={Icons.backgroundColor}
              size={16}
            />
          }
        >
          <Box mt={2} />
          <ColorPicker
            editor={editor}
            expanded={true}
            color={attributes.backgroundColor}
            onChange={(color) =>
              editor.commands.setCellAttribute("backgroundColor", color)
            }
            onClear={() =>
              editor.commands.setCellAttribute("backgroundColor", undefined)
            }
          />
        </Tab>
        <Tab
          title={
            <Icon
              title={strings.cellTextColor()}
              path={Icons.textColor}
              size={16}
            />
          }
        >
          <Box mt={2} />
          <ColorPicker
            editor={editor}
            expanded={true}
            color={attributes.color}
            onChange={(color) =>
              editor.commands.setCellAttribute("color", color)
            }
            onClear={() => editor.commands.setCellAttribute("color", undefined)}
          />
        </Tab>
        <Tab
          title={
            <Icon
              title={strings.cellBorderColor()}
              path={Icons.cellBorderColor}
              size={16}
            />
          }
        >
          <Box mt={2} />
          <ColorPicker
            editor={editor}
            expanded={true}
            color={attributes.borderColor}
            onChange={(color) =>
              editor.commands.setCellAttribute("borderColor", color)
            }
            onClear={() =>
              editor.commands.setCellAttribute("borderColor", undefined)
            }
          />
        </Tab>
      </Tabs>
    </Popup>
  );
}
