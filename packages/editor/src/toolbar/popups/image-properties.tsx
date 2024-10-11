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

import { Flex } from "@theme-ui/components";
import { Popup } from "../components/popup.js";
import { ImageAttributes } from "../../extensions/image/index.js";
import { Editor } from "../../types.js";
import { InlineInput } from "../../components/inline-input/index.js";
import { findSelectedNode } from "../../utils/prosemirror.js";
import { strings } from "@notesnook/intl";

export type ImagePropertiesProps = {
  editor: Editor;
  onClose: () => void;
};
export function ImageProperties(props: ImagePropertiesProps) {
  const { editor, onClose } = props;

  const image = findSelectedNode(editor, "image");
  if (!image) return null;

  const { width, height, aspectRatio } = image.attrs as ImageAttributes;

  return (
    <Popup title={strings.imageProperties()} onClose={onClose}>
      <Flex sx={{ width: ["auto", 300], alignItems: "center", p: 1 }}>
        <InlineInput
          label="width"
          type="number"
          value={width || 0}
          containerProps={{
            sx: { mr: 1 }
          }}
          onChange={(e) => {
            editor.commands.setImageSize({
              width: e.target.valueAsNumber,
              height: aspectRatio
                ? e.target.valueAsNumber / aspectRatio
                : e.target.valueAsNumber
            });
          }}
        />
        <InlineInput
          label="height"
          type="number"
          value={height || 0}
          onChange={(e) => {
            editor.commands.setImageSize({
              width: aspectRatio
                ? e.target.valueAsNumber * aspectRatio
                : e.target.valueAsNumber,
              height: e.target.valueAsNumber
            });
          }}
        />
      </Flex>
    </Popup>
  );
}
