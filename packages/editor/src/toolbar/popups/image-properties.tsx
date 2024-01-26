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
import { Popup } from "../components/popup";
import { ImageAttributes } from "../../extensions/image";
import { Editor } from "../../types";
import { InlineInput } from "../../components/inline-input";
import { findSelectedNode } from "../../utils/prosemirror";

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
    <Popup title="Image properties" onClose={onClose}>
      <Flex sx={{ width: ["auto", 300], alignItems: "center", p: 1 }}>
        <InlineInput
          label="width"
          type="number"
          value={width || 0}
          containerProps={{
            sx: { mr: 1 }
          }}
          onChange={(e) => {
            editor.current?.commands.setImageSize({
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
            editor.current?.commands.setImageSize({
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
