import { Button, Flex, Text } from "rebass";
import { useCallback, useEffect, useState } from "react";
import { Popup } from "../components/popup";
import { Toggle } from "../../components/toggle";
import { Input, Textarea } from "@rebass/forms";
import {
  ImageAlignmentOptions,
  ImageSizeOptions,
} from "../../extensions/image";
import { Editor } from "@tiptap/core";
import { InlineInput } from "../../components/inline-input";

export type ImagePropertiesProps = ImageSizeOptions &
  ImageAlignmentOptions & { editor: Editor; onClose: () => void };
export function ImageProperties(props: ImagePropertiesProps) {
  const { height, width, float, editor, onClose } = props;

  const onSizeChange = useCallback(
    (newWidth?: number, newHeight?: number) => {
      const size: ImageSizeOptions = newWidth
        ? {
            width: newWidth,
            height: newWidth * (height / width),
          }
        : newHeight
        ? {
            width: newHeight * (width / height),
            height: newHeight,
          }
        : {
            width: 0,
            height: 0,
          };

      editor.chain().setImageSize(size).run();
    },
    [width, height]
  );

  return (
    <Popup title="Image properties" onClose={onClose}>
      <Flex sx={{ width: ["auto", 300], flexDirection: "column", p: 1 }}>
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Text variant={"body"}>Floating?</Text>
          <Toggle
            checked={float}
            onClick={() =>
              editor
                .chain()
                .setImageAlignment({ float: !float, align: "left" })
                .run()
            }
          />
        </Flex>
        <Flex sx={{ alignItems: "center", mt: 2 }}>
          <InlineInput
            label="width"
            type="number"
            value={width}
            containerProps={{
              sx: { mr: 1 },
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
