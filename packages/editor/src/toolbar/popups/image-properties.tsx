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

export type ImagePropertiesProps = ImageSizeOptions &
  ImageAlignmentOptions & { editor: Editor };
export function ImageProperties(props: ImagePropertiesProps) {
  const { height, width, float, editor } = props;

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
    <Flex sx={{ width: 200, flexDirection: "column", p: 1 }}>
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
        <Input
          type="number"
          placeholder="Width"
          value={width}
          sx={{
            mr: 2,
            p: 1,
            fontSize: "body",
          }}
          onChange={(e) => onSizeChange(e.target.valueAsNumber)}
        />
        <Input
          type="number"
          placeholder="Height"
          value={height}
          sx={{ p: 1, fontSize: "body" }}
          onChange={(e) => onSizeChange(undefined, e.target.valueAsNumber)}
        />
      </Flex>
    </Flex>
  );
}
