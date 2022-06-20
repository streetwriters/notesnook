import { Box, Flex, Image, ImageProps } from "rebass";
import {
  ImageAlignmentOptions,
  ImageAttributes,
  ImageSizeOptions,
} from "./image";
import { Theme } from "@notesnook/theme";
import { Resizable } from "re-resizable";
import { ToolButton } from "../../toolbar/components/tool-button";
import { Editor } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { ReactNodeViewProps, SelectionBasedReactNodeViewProps } from "../react";
import { ResponsivePresenter } from "../../components/responsive";
import { ImageProperties } from "../../toolbar/popups/image-properties";
import { Popup } from "../../toolbar/components/popup";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { ImageToolbar } from "../../toolbar/floatingmenus/image";

export function ImageComponent(
  props: SelectionBasedReactNodeViewProps<
    ImageAttributes & ImageAlignmentOptions
  >
) {
  const { editor, updateAttributes, node, selected } = props;
  const { src, alt, title, width, height, align, float } = node.attrs;
  const imageRef = useRef<HTMLImageElement>();

  useEffect(() => {
    (async () => {
      if (!imageRef.current) return;
      imageRef.current.src = await dataUriToBlobURL(src);
    })();
  }, [src, imageRef]);

  return (
    <>
      <Box
        sx={{
          display: float ? "block" : "flex",
          justifyContent: float
            ? "stretch"
            : align === "center"
            ? "center"
            : align === "left"
            ? "start"
            : "end",
          ":hover .drag-handle, :active .drag-handle": {
            opacity: 1,
          },
        }}
        draggable={false}
      >
        <Resizable
          style={{
            position: "relative",
            float: float ? (align === "left" ? "left" : "right") : "none",
          }}
          size={{
            height: height || "auto",
            width: width || "auto",
          }}
          maxWidth="100%"
          onResizeStop={(e, direction, ref, d) => {
            updateAttributes({
              width: ref.clientWidth,
              height: ref.clientHeight,
            });
          }}
          lockAspectRatio={true}
        >
          {selected && (
            <Flex sx={{ position: "relative", justifyContent: "end" }}>
              <Flex
                sx={{
                  position: "absolute",
                  top: -40,
                  mb: 2,
                  alignItems: "end",
                }}
              >
                <ImageToolbar editor={editor} />
              </Flex>
            </Flex>
          )}
          <Icon
            className="drag-handle"
            data-drag-handle
            draggable
            path={Icons.dragHandle}
            sx={{
              cursor: "grab",
              position: "absolute",
              top: 2,
              left: 2,
              zIndex: 999,
              opacity: selected ? 1 : 0,
            }}
          />
          <Image
            data-drag-image
            ref={imageRef}
            alt={alt}
            title={title}
            width={"100%"}
            height={"100%"}
            sx={{
              border: selected
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              borderRadius: "default",
            }}
            {...props}
          />
        </Resizable>
      </Box>
    </>
  );
}

async function dataUriToBlobURL(dataurl: string) {
  if (!dataurl.startsWith("data:image")) return dataurl;

  const response = await fetch(dataurl);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
