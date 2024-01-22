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
import { useCallback } from "react";
import { Popup } from "../components/popup";
import { Checkbox, Label } from "@theme-ui/components";
import {
  ImageAlignmentOptions,
  ImageSizeOptions
} from "../../extensions/image";
import { Editor } from "../../types";
import { InlineInput } from "../../components/inline-input";
import { DesktopOnly } from "../../components/responsive";

export type ImagePropertiesProps = ImageSizeOptions &
  ImageAlignmentOptions & { editor: Editor; onClose: () => void };
export function ImageProperties(props: ImagePropertiesProps) {
  const { height, width, float, editor, onClose } = props;

  const onSizeChange = useCallback(
    (newWidth?: number, newHeight?: number) => {
      const size: ImageSizeOptions = newWidth
        ? {
            width: newWidth,
            height: newWidth * (height / width)
          }
        : newHeight
        ? {
            width: newHeight * (width / height),
            height: newHeight
          }
        : {
            width: 0,
            height: 0
          };

      editor.chain().setImageSize(size).run();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height]
  );

  return (
    <Popup title="Image properties" onClose={onClose}>
      <Flex sx={{ width: ["auto", 300], flexDirection: "column", p: 1 }}>
        <DesktopOnly>
          <Label
            variant="text.body"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            Float image
            <Checkbox
              checked={float}
              onClick={() =>
                editor
                  .chain()
                  .setImageAlignment({ float: !float, align: "left" })
                  .run()
              }
            />
          </Label>
        </DesktopOnly>
        <Flex sx={{ alignItems: "center", mt: 2 }}>
          <InlineInput
            label="width"
            type="number"
            value={width}
            containerProps={{
              sx: { mr: 1 }
            }}
            onChange={(e) => onSizeChange(e.target.valueAsNumber)}
          />
          <InlineInput
            label="height"
            type="number"
            value={height}
            onChange={(e) => onSizeChange(undefined, e.target.valueAsNumber)}
          />
        </Flex>
      </Flex>
    </Popup>
  );
}
