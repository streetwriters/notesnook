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

import { q } from "../../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../../queries/use-query.js";
import type { EditorController } from "../../controller.js";
import { Box, Icon } from "@ui";
import { Tab, Tabs } from "../../components/tabs/index.js";
import { Popup } from "../components/popup.js";
import { Icons } from "../icons.js";
import { ColorPicker } from "./color-picker.js";
import { strings } from "@notesnook/intl";

type CellPropertiesProps = { editor: EditorController; onClose: () => void };
export function CellProperties(props: CellPropertiesProps) {
  const { editor, onClose } = props;
  const attributes = useEditorQuery(editor, q.attributes("tableCell"), {}) as {
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
  };
  const setAttribute = (name: string, value: string | undefined) =>
    editor.run({ name: "setCellAttribute", args: [name, value] });
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
            expanded={true}
            color={attributes.backgroundColor}
            onChange={(color) => setAttribute("backgroundColor", color)}
            onClear={() => setAttribute("backgroundColor", undefined)}
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
            expanded={true}
            color={attributes.color}
            onChange={(color) => setAttribute("color", color)}
            onClear={() => setAttribute("color", undefined)}
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
            expanded={true}
            color={attributes.borderColor}
            onChange={(color) => setAttribute("borderColor", color)}
            onClear={() => setAttribute("borderColor", undefined)}
          />
        </Tab>
      </Tabs>
    </Popup>
  );
}
