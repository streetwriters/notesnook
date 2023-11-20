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

import { Box, Flex, Image } from "@theme-ui/components";
import { ImageAlignmentOptions, ImageAttributes } from "./image";
import { useRef } from "react";
import { SelectionBasedReactNodeViewProps } from "../react";
import { DesktopOnly } from "../../components/responsive";
import { Icon } from "@notesnook/ui";
import { Icons } from "../../toolbar/icons";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import {
  useIsMobile,
  useToolbarStore
} from "../../toolbar/stores/toolbar-store";
import { Resizer } from "../../components/resizer";
import {
  corsify,
  downloadImage,
  isDataUrl,
  toBlobURL,
  toDataURL
} from "../../utils/downloader";
import { motion } from "framer-motion";

export const AnimatedImage = motion(Image);

export function ImageComponent(
  props: SelectionBasedReactNodeViewProps<
    ImageAttributes & ImageAlignmentOptions
  >
) {
  const { editor, node, selected } = props;
  const isMobile = useIsMobile();
  const {
    bloburl,
    src,
    alt,
    title,
    width,
    height,
    textDirection,
    hash,
    aspectRatio,
    mime
  } = node.attrs;
  const float = isMobile ? false : node.attrs.float;

  let align = node.attrs.align;
  if (!align) align = textDirection ? "right" : "left";

  const imageRef = useRef<HTMLImageElement>(null);
  const downloadOptions = useToolbarStore((store) => store.downloadOptions);
  const isReadonly = !editor.current?.isEditable;
  const isSVG = mime.includes("/svg");
  const relativeHeight = aspectRatio
    ? editor.view.dom.clientWidth / aspectRatio
    : undefined;

  return (
    <>
      <Box
        sx={{
          display: float ? "inline" : "flex",
          ml: float ? (align === "right" ? 2 : 0) : 0,
          mr: float ? (align === "left" ? 2 : 0) : 0,
          float: float ? (align as "left" | "right") : "none",
          justifyContent: float
            ? "stretch"
            : align === "center"
            ? "center"
            : align === "left"
            ? "start"
            : "end",
          position: "relative",
          mt: isSVG ? `24px` : 0,
          ":hover .drag-handle, :active .drag-handle": {
            opacity: 1
          }
        }}
      >
        {!src && !bloburl && hash && (
          <Flex
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: width || "100%",
              height: height || relativeHeight || "100%",
              maxWidth: "100%",
              minWidth: 135,
              bg: "background-secondary",
              border: selected
                ? "2px solid var(--accent)"
                : "2px solid transparent",
              borderRadius: "default",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              mt: 1,
              py: 50
            }}
          >
            <Icon
              path={Icons.image}
              size={width ? width * 0.2 : 72}
              color="gray"
            />
          </Flex>
        )}
        <Resizer
          style={{ marginTop: 5 }}
          enabled={editor.isEditable && !float}
          selected={selected}
          width={width}
          height={height || relativeHeight}
          onResize={(width, height) => {
            editor.commands.setImageSize({ width, height });
          }}
        >
          <DesktopOnly>
            {selected && (
              <Flex
                sx={{
                  position: "absolute",
                  top: -40,
                  right: 0,
                  mb: 2,
                  alignItems: "end",
                  zIndex: 999
                }}
              >
                <ToolbarGroup
                  editor={editor}
                  tools={
                    isReadonly
                      ? [
                          hash ? "previewAttachment" : "none",
                          hash ? "downloadAttachment" : "none"
                        ]
                      : [
                          hash ? "previewAttachment" : "none",
                          hash ? "downloadAttachment" : "none",
                          "imageAlignLeft",
                          float ? "none" : "imageAlignCenter",
                          "imageAlignRight",
                          "imageProperties"
                        ]
                  }
                  sx={{
                    boxShadow: "menu",
                    borderRadius: "default",
                    bg: "background"
                  }}
                />
              </Flex>
            )}
          </DesktopOnly>
          {!isReadonly && selected && (
            <Icon
              className="drag-handle"
              data-drag-handle
              draggable
              path={Icons.dragHandle}
              color="black"
              sx={{
                cursor: "grab",
                position: "absolute",
                top: 1,
                left: 1,
                zIndex: 999
              }}
            />
          )}
          {isSVG ? (
            <Box
              sx={{
                width: "100%",
                display: editor.isEditable ? "flex" : "none",
                position: "absolute",
                top: -24,
                height: 24,
                justifyContent: "end",
                p: "small",
                bg: editor.isEditable
                  ? "var(--background-secondary)"
                  : "transparent",
                borderTopLeftRadius: "default",
                borderTopRightRadius: "default",
                borderColor: selected ? "border" : "var(--border-secondary)",
                cursor: "pointer",
                ":hover": {
                  borderColor: "border"
                }
              }}
            ></Box>
          ) : null}
          <AnimatedImage
            as={isSVG ? "object" : "img"}
            initial={{ opacity: 0 }}
            animate={{ opacity: bloburl || src ? 1 : 0 }}
            transition={{ duration: 0.5, ease: "easeIn" }}
            data-drag-image
            ref={imageRef}
            alt={alt}
            crossOrigin="anonymous"
            {...(isSVG
              ? {
                  data:
                    toBlobURL("", hash) ||
                    bloburl ||
                    corsify(src, downloadOptions?.corsHost),
                  type: mime
                }
              : {
                  src:
                    toBlobURL("", hash) ||
                    bloburl ||
                    corsify(src, downloadOptions?.corsHost)
                })}
            title={title}
            sx={{
              objectFit: "contain",
              width: editor.isEditable ? "100%" : width,
              height: editor.isEditable ? "100%" : height,
              border: selected
                ? "2px solid var(--accent) !important"
                : "2px solid transparent !important",
              borderRadius: "default"
            }}
            onDoubleClick={() =>
              editor.current?.commands.previewAttachment(node.attrs)
            }
            onLoad={async () => {
              if (!imageRef.current) return;
              const { clientHeight, clientWidth } = imageRef.current;

              if (!isDataUrl(src) && canParse(src)) {
                const { url, size, blob, mimeType } = await downloadImage(
                  src,
                  downloadOptions
                );
                editor.current?.commands.updateImage(
                  { src, hash },
                  {
                    src: await toDataURL(blob),
                    bloburl: url,
                    size: size,
                    mime: mimeType,
                    aspectRatio:
                      !height && !width && !aspectRatio
                        ? clientWidth / clientHeight
                        : undefined
                  }
                );
              } else if (!height && !width && !aspectRatio) {
                editor.current?.commands.updateImage(
                  { src, hash },
                  {
                    aspectRatio: clientWidth / clientHeight
                  }
                );
              }
            }}
          />
        </Resizer>
        {/* )} */}
      </Box>
    </>
  );
}

function canParse(src: string) {
  if (!src) return false;
  try {
    return !!new URL(src);
  } catch {
    return false;
  }
}
