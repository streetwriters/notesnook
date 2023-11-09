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

import { Box, Button, Flex, Image, Text } from "@theme-ui/components";
import { ImageAlignmentOptions, ImageAttributes } from "./image";
import { useEffect, useRef, useState } from "react";
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
  downloadImage,
  isDataUrl,
  toBlobURL,
  toDataURL
} from "../../utils/downloader";
import { motion } from "framer-motion";

const IMAGE_SOURCE_CACHE: Record<string, string | undefined> = {};
export const AnimatedImage = motion(Image);

type imageInfo = {
  size: number;
  blob: Blob;
  type: string;
};

export function ImageComponent(
  props: SelectionBasedReactNodeViewProps<
    ImageAttributes & ImageAlignmentOptions
  >
) {
  const { editor, node, selected } = props;
  const isMobile = useIsMobile();
  const {
    dataurl,
    src,
    alt,
    title,
    width,
    height,
    textDirection,
    hash,
    aspectRatio
  } = node.attrs;
  const float = isMobile ? false : node.attrs.float;

  let align = node.attrs.align;
  if (!align) align = textDirection ? "right" : "left";

  const imageRef = useRef<HTMLImageElement>(null);
  const imageInfoRef = useRef<imageInfo>();
  const [error, setError] = useState<string>();
  const [source, setSource] = useState<string>();
  const downloadOptions = useToolbarStore((store) => store.downloadOptions);
  const isReadonly = !editor.current?.isEditable;
  const hasOrSrc = hash || src;
  useEffect(
    () => {
      (async () => {
        if (!src && !dataurl && !IMAGE_SOURCE_CACHE[hasOrSrc]) return;
        try {
          if (IMAGE_SOURCE_CACHE[hasOrSrc])
            setSource(IMAGE_SOURCE_CACHE[hasOrSrc]);
          else if (dataurl) setSource(await toBlobURL(dataurl));
          else if (isDataUrl(src)) setSource(await toBlobURL(src));
          else if (canParse(src)) {
            const { url, size, blob, type } = await downloadImage(
              src,
              downloadOptions
            );
            setSource(url);
            imageInfoRef.current = { size, blob, type };
          } else {
            setError("Failed to parse source url.");
          }
        } catch (e) {
          console.error(e);
          if (e instanceof Error) setError(e.message);
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [src, dataurl, imageRef, downloadOptions]
  );

  if (source && hasOrSrc) IMAGE_SOURCE_CACHE[hasOrSrc] = source;
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
          ":hover .drag-handle, :active .drag-handle": {
            opacity: 1
          }
        }}
      >
        {!source || error ? (
          <Flex
            sx={{
              width: width || "100%",
              height: height || relativeHeight || "100%",
              maxWidth: "100%",
              minWidth: 135,
              bg: "background",
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
              path={
                error
                  ? Icons.imageFailed
                  : isDownloadable(source, src)
                  ? Icons.imageDownload
                  : Icons.image
              }
              size={width ? width * 0.2 : 72}
              color="gray"
            />

            <Text
              as="span"
              variant={"subBody"}
              sx={{
                display: "inline-block",
                textDecoration: "none",
                textAlign: "center",
                mx: 2,
                mt: 2
              }}
            >
              {error
                ? `There was an error loading the image: ${error}`
                : isDownloadable(source, src)
                ? `Downloading image`
                : ""}
            </Text>
            {error ? (
              <Button
                variant="secondary"
                sx={{ mt: 1 }}
                onClick={() => {
                  setSource(src);
                  setError(undefined);
                }}
              >
                Skip downloading (unsafe)
              </Button>
            ) : null}
          </Flex>
        ) : (
          <Resizer
            style={{ marginTop: 5 }}
            editor={editor}
            selected={selected}
            width={width}
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
                    alignItems: "end"
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
            <AnimatedImage
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeIn" }}
              data-drag-image
              ref={imageRef}
              alt={alt}
              src={source}
              title={title}
              sx={{
                width: editor.isEditable ? "100%" : width,
                height: editor.isEditable ? "100%" : height,
                border: selected
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                borderRadius: "default"
              }}
              onDoubleClick={() =>
                editor.current?.commands.previewAttachment(node.attrs)
              }
              onLoad={async (e) => {
                const { clientHeight, clientWidth } = e.currentTarget;
                if (!height && !width && !aspectRatio && imageInfoRef.current) {
                  editor.current?.commands.updateImage(
                    { src },
                    {
                      src: await toDataURL(imageInfoRef.current.blob),
                      size: imageInfoRef.current.size,
                      mime: imageInfoRef.current.type,
                      aspectRatio: clientWidth / clientHeight
                    }
                  );
                }
              }}
            />
          </Resizer>
        )}
      </Box>
    </>
  );
}

function isDownloadable(source?: string, src?: string) {
  return !source && src && !isDataUrl(src);
}

function canParse(src: string) {
  try {
    return !!new URL(src);
  } catch {
    return false;
  }
}
