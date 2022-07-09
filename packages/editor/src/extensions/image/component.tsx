import { Box, Flex, Image } from "rebass";
import { ImageAlignmentOptions, ImageAttributes } from "./image";
import { Resizable } from "re-resizable";
import { useEffect, useRef } from "react";
import { SelectionBasedReactNodeViewProps } from "../react";
import { DesktopOnly } from "../../components/responsive";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import { useIsMobile } from "../../toolbar/stores/toolbar-store";
import { Resizer } from "../../components/resizer";

export function ImageComponent(
  props: SelectionBasedReactNodeViewProps<
    ImageAttributes & ImageAlignmentOptions
  >
) {
  const { editor, updateAttributes, node, selected } = props;
  const isMobile = useIsMobile();
  let { src, alt, title, width, height, align, float } = node.attrs;
  const imageRef = useRef<HTMLImageElement>();

  useEffect(() => {
    (async () => {
      if (!imageRef.current || !src) return;
      imageRef.current.src = await dataUriToBlobURL(src);
    })();
  }, [src, imageRef]);

  if (isMobile) float = false;

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
      >
        <Resizer
          editor={editor}
          selected={selected}
          width={width}
          height={height}
          onResize={(width, height) => {
            updateAttributes(
              {
                width,
                height,
              },
              { addToHistory: true, preventUpdate: false }
            );
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
                    alignItems: "end",
                  }}
                >
                  <ToolbarGroup
                    editor={editor}
                    tools={[
                      "imageAlignLeft",
                      "imageAlignCenter",
                      "imageAlignRight",
                      "imageProperties",
                    ]}
                    sx={{
                      boxShadow: "menu",
                      borderRadius: "default",
                      bg: "background",
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
                zIndex: 999,
              }}
            />
          )}
          <Image
            data-drag-image
            ref={imageRef}
            alt={alt}
            src="/placeholder.svg"
            title={title}
            width={"100%"}
            height={"100%"}
            sx={{
              bg: "bgSecondary",
              border: selected
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              borderRadius: "default",
            }}
            {...props}
          />
        </Resizer>
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
