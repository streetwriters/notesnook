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

import { ThemeUIStyleObject } from "@theme-ui/core";
import { Box, Flex, Image, Text } from "@theme-ui/components";
import { ImageAttributes } from "./image";
import { useEffect, useState } from "react";
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
  revokeBloburl,
  toBlobURL,
  toDataURL
} from "../../utils/downloader";
import { motion } from "framer-motion";
import { useObserver } from "../../hooks/use-observer";
import { Attachment, ImageAlignmentOptions } from "../attachment";
import DataURL from "@notesnook/core/dist/utils/dataurl";

export const AnimatedImage = motion(Image);

export function ImageComponent(
  props: SelectionBasedReactNodeViewProps<Partial<ImageAttributes>>
) {
  const { editor, node, selected } = props;
  const { src, alt, title, textDirection, hash, aspectRatio, mime, progress } =
    node.attrs;
  const [bloburl, setBloburl] = useState<string | undefined>(
    toBlobURL("", "image", mime, hash)
  );

  const isMobile = useIsMobile();
  const { inView, ref: imageRef } = useObserver<HTMLImageElement>({
    threshold: 0.2,
    once: true
  });
  const float = isMobile ? false : node.attrs.float;

  let align = node.attrs.align;
  if (!align) align = textDirection ? "right" : "left";

  const downloadOptions = useToolbarStore((store) => store.downloadOptions);
  const isReadonly = !editor.current?.isEditable;
  const isSVG = !!mime && mime.includes("/svg");

  const { height, width } = clampSize(
    node.attrs,
    editor.view.dom.clientWidth,
    aspectRatio
  );

  useEffect(() => {
    if (!inView) return;
    if (src || !hash || bloburl) return;
    (async function () {
      const data = await editor.current?.storage
        .getAttachmentData?.(node.attrs)
        .catch(() => null);
      if (typeof data !== "string" || !data) return; // TODO: show error

      setBloburl(toBlobURL(data, "image", node.attrs.mime, hash));
    })();
  }, [inView]);

  useEffect(() => {
    return () => {
      if (!hash) return;
      revokeBloburl(hash);
    };
  }, []);

  return (
    <>
      <Box
        sx={{
          ...getAlignmentStyles(node.attrs),
          position: "relative",
          mt: isSVG ? `24px` : 0,
          ":hover .drag-handle, :active .drag-handle": {
            opacity: 1
          }
        }}
      >
        <Resizer
          style={{ marginTop: 5 }}
          enabled={editor.isEditable && !float}
          selected={selected}
          width={width}
          height={height}
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
                          "imageAlignCenter",
                          "imageAlignRight",
                          "imageFloat",
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
          {progress ? (
            <Flex
              sx={{
                position: "absolute",
                bottom: 2,
                right: 2,
                bg: "background",
                borderRadius: 100,
                p: 1,
                px: 2,
                border: "1px solid var(--border)",
                zIndex: 2
              }}
            >
              <Icon path={Icons.loading} rotate size={14} sx={{ mr: 1 }} />
              <Text variant="body">{progress}%</Text>
            </Flex>
          ) : null}
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

          {!src && !bloburl && hash && (
            <Flex
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: editor.isEditable ? "100%" : width,
                height: editor.isEditable ? "100%" : height,
                bg: "background-secondary",
                border: selected
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                borderRadius: "default",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // mt: 1,
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
          <AnimatedImage
            as={isSVG ? "object" : "img"}
            initial={{ opacity: 0 }}
            animate={{ opacity: bloburl || src ? 1 : 0 }}
            transition={{ duration: 0.2, ease: "easeIn" }}
            data-drag-image
            ref={imageRef}
            alt={alt}
            crossOrigin="anonymous"
            {...(isSVG
              ? {
                  data: bloburl || corsify(src, downloadOptions?.corsHost),
                  type: mime
                }
              : {
                  src: bloburl || corsify(src, downloadOptions?.corsHost)
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
            onDoubleClick={() => {
              const { hash, filename, mime, size } = node.attrs;
              if (!!hash && !!filename && !!mime && !!size)
                editor.current?.commands.previewAttachment({
                  type: "image",
                  hash,
                  filename,
                  mime,
                  size
                });
            }}
            onLoad={async function onLoad() {
              if (!imageRef.current) return;

              const { naturalWidth, naturalHeight, clientHeight, clientWidth } =
                imageRef.current;
              const orignalWidth = naturalWidth || clientWidth;
              const orignalHeight = naturalHeight || clientHeight;
              const naturalAspectRatio = orignalWidth / orignalHeight;
              const fixedDimensions = fixAspectRatio(width, naturalAspectRatio);

              if (src && !DataURL.isValid(src) && canParse(src)) {
                const image = await downloadImage(src, downloadOptions);
                if (!image) return;
                const { url, size, blob, mimeType } = image;
                imageRef.current.src = url;
                const dataurl = await toDataURL(blob);
                await editor.threadsafe((editor) =>
                  editor.commands.updateAttachment(
                    {
                      ...fixedDimensions,
                      src: dataurl,
                      size: size,
                      mime: mimeType,
                      aspectRatio: naturalAspectRatio
                    },
                    { query: makeImageQuery(src, hash) }
                  )
                );
              } else if (!aspectRatio || aspectRatio != naturalAspectRatio) {
                await editor.threadsafe((editor) =>
                  editor.commands.updateAttachment(
                    {
                      ...fixedDimensions,
                      aspectRatio: naturalAspectRatio
                    },
                    { query: makeImageQuery(src, hash), ignoreEdit: true }
                  )
                );
              } else if (height !== fixedDimensions.height) {
                await editor.threadsafe((editor) =>
                  editor.commands.updateAttachment(fixedDimensions, {
                    query: makeImageQuery(src, hash),
                    ignoreEdit: true
                  })
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

function makeImageQuery(src?: string, hash?: string) {
  return (a: Attachment) =>
    a.type === "image" &&
    ((!!a.src && !!src && a.src === src) ||
      (!!a.hash && !!hash && a.hash === hash));
}
function canParse(src: string) {
  if (!src) return false;
  try {
    return !!new URL(src);
  } catch {
    return false;
  }
}

function clampSize(
  size: { width?: number; height?: number },
  maxWidth: number,
  aspectRatio?: number
): { width: number; height: number } {
  if (typeof aspectRatio === "string" && isNaN(aspectRatio)) aspectRatio = 1;

  // if no size we set the image to maximum size.
  if (!size.width || !size.height) return { width: maxWidth, height: maxWidth };

  if (!aspectRatio) aspectRatio = size.width / size.height;

  if (size.width > maxWidth)
    return { width: maxWidth, height: maxWidth / aspectRatio };

  return {
    height: size.height,
    width: size.width
  };
}

function fixAspectRatio(width: number, aspectRatio: number) {
  return {
    width,
    height: width / aspectRatio
  };
}

function getAlignmentStyles(
  options: ImageAlignmentOptions
): ThemeUIStyleObject {
  const { align, float } = options;
  if (float && align !== "center") {
    return {
      display: "inline",
      ml: align === "right" ? 2 : 0,
      mr: align === "left" ? 2 : 0,
      float: align,
      justifyContent: "stretch"
    };
  }

  return {
    display: "flex",
    justifyContent:
      align === "center" ? "center" : align === "right" ? "end" : "start"
  };
}
