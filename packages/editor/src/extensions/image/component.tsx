import { Box, Button, Flex, Image, Text } from "@streetwriters/rebass";
import { ImageAlignmentOptions, ImageAttributes } from "./image";
import { useEffect, useRef, useState } from "react";
import { SelectionBasedReactNodeViewProps } from "../react";
import { DesktopOnly } from "../../components/responsive";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";
import { Resizer } from "../../components/resizer";
import {
  downloadImage,
  isDataUrl,
  toBlobURL,
  toDataURL
} from "../../utils/downloader";

export function ImageComponent(
  props: SelectionBasedReactNodeViewProps<
    ImageAttributes & ImageAlignmentOptions
  >
) {
  const { editor, node, selected } = props;
  const isMobile = useIsMobile();
  const { src, alt, title, width, height, align } = node.attrs;
  const float = isMobile ? false : node.attrs.float;

  const imageRef = useRef<HTMLImageElement>();
  const [error, setError] = useState<string>();
  const [source, setSource] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!src) return;
      try {
        if (isDataUrl(src)) setSource(await toBlobURL(src));
        else {
          const { url, size, blob, type } = await downloadImage(src);
          setSource(url);
          console.log(url, size, blob, type);
          editor.current?.commands.updateImage(
            { src },
            { src: await toDataURL(blob), size, type }
          );
        }
      } catch (e) {
        console.error(e);
        if (e instanceof Error) setError(e.message);
      }
    })();
  }, [src, imageRef]);

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
            width={width}
            maxWidth="100%"
            minWidth={135}
            sx={{
              bg: "bgSecondary",
              border: selected
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              borderRadius: "default",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
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
              size={72}
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
                ? `Downloading image from ${getHostname(src)}`
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
            editor={editor}
            selected={selected}
            width={width}
            height={height}
            onResize={(width, height) => {
              editor.commands.setImageSize({ width, height });
            }}
          >
            <DesktopOnly>
              {selected && (
                <Flex sx={{ position: "relative", justifyContent: "end" }}>
                  <Flex
                    sx={{
                      position: "absolute",
                      top: -40,
                      mb: 2,
                      alignItems: "end"
                    }}
                  >
                    <ToolbarGroup
                      editor={editor}
                      tools={
                        float
                          ? [
                              "imageAlignLeft",
                              "imageAlignRight",
                              "imageProperties"
                            ]
                          : [
                              "imageAlignLeft",
                              "imageAlignCenter",
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
                </Flex>
              )}
            </DesktopOnly>
            {selected && (
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
                  zIndex: 999
                }}
              />
            )}
            <Image
              data-drag-image
              ref={imageRef}
              alt={alt}
              src={source}
              title={title}
              width={editor.isEditable ? "100%" : width}
              height={editor.isEditable ? "100%" : height}
              sx={{
                bg: "bgSecondary",
                border: selected
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
                borderRadius: "default"
              }}
              {...props}
            />
          </Resizer>
        )}
      </Box>
    </>
  );
}

function getHostname(src?: string) {
  if (!src) return null;

  return new URL(src).hostname;
}

function isDownloadable(source?: string, src?: string) {
  return !source && src && !isDataUrl(src);
}
