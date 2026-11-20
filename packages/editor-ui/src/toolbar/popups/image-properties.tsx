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

import { q, useEditorQuery } from "../../queries/index.js";
import { Flex } from "@theme-ui/components";
import { Popup } from "../components/popup.js";
import { ImageAttributes } from "../../extension-types.js";
import { Editor } from "../../types.js";
import { InlineInput } from "../../components/inline-input/index.js";
import { strings } from "@notesnook/intl";

export type ImagePropertiesProps = {
  editor: Editor;
  onClose: () => void;
};
export function ImageProperties(props: ImagePropertiesProps) {
  const { editor, onClose } = props;

  const image = useEditorQuery(editor, q.selectedNode("image"));
  if (!image) return null;

  const { width, height, aspectRatio } = image as ImageAttributes;

  return (
    <Popup title={strings.imageProperties()} onClose={onClose}>
      <Flex sx={{ width: ["auto", 300], alignItems: "center", p: 1 }}>
        <InlineInput
          label={strings.width()}
          type="number"
          value={String(width || 0)}
          containerProps={{
            sx: { mr: 1 }
          }}
          onChangeText={(text) => {
            const value = Number(text);
            editor.commands.setImageSize({
              width: value,
              height: aspectRatio ? value / aspectRatio : value
            });
          }}
        />
        <InlineInput
          label={strings.height()}
          type="number"
          value={String(height || 0)}
          onChangeText={(text) => {
            const value = Number(text);
            editor.commands.setImageSize({
              width: aspectRatio ? value * aspectRatio : value,
              height: value
            });
          }}
        />
      </Flex>
    </Popup>
  );
}
