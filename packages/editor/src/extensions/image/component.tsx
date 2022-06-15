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

export function ImageComponent(
  props: SelectionBasedReactNodeViewProps<
    ImageAttributes & ImageAlignmentOptions
  >
) {
  const { editor, updateAttributes, node, selected } = props;
  const { src, alt, title, width, height, align, float } = node.attrs;
  const imageRef = useRef<HTMLImageElement>();

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
        }}
      >
        <Resizable
          style={{
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
              <ImageToolbar
                editor={editor}
                float={float}
                align={align}
                height={height || 0}
                width={width || 0}
              />
            </Flex>
          )}
          <Image
            ref={imageRef}
            src={src}
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

type ImageToolbarProps = ImageAlignmentOptions &
  Required<ImageSizeOptions> & {
    editor: Editor;
  };

function ImageToolbar(props: ImageToolbarProps) {
  const { editor, float, height, width } = props;
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>();

  return (
    <Flex
      ref={ref}
      sx={{
        flexDirection: "column",
        position: "absolute",
        top: -40,
        mb: 2,
        zIndex: 9999,
        alignItems: "end",
      }}
    >
      <Flex
        sx={{
          bg: "background",
          boxShadow: "menu",
          flexWrap: "nowrap",
          borderRadius: "default",
          mb: 2,
        }}
      >
        <Flex
          className="toolbar-group"
          sx={{
            pr: 1,
            mr: 1,
            borderRight: "1px solid var(--border)",
            ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
          }}
        >
          <ToolButton
            toggled={false}
            title="Align left"
            id="alignLeft"
            icon="alignLeft"
            onClick={() =>
              editor.chain().focus().setImageAlignment({ align: "left" }).run()
            }
          />
          {float ? null : (
            <ToolButton
              toggled={false}
              title="Align center"
              id="alignCenter"
              icon="alignCenter"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .setImageAlignment({ align: "center" })
                  .run()
              }
            />
          )}
          <ToolButton
            toggled={false}
            title="Align right"
            id="alignRight"
            icon="alignRight"
            onClick={() =>
              editor.chain().focus().setImageAlignment({ align: "right" }).run()
            }
          />
        </Flex>
        <Flex
          className="toolbar-group"
          sx={{
            pr: 1,
            mr: 1,
            borderRight: "1px solid var(--border)",
            ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
          }}
        >
          <ToolButton
            toggled={isOpen}
            title="Image properties"
            id="imageProperties"
            icon="more"
            onClick={() => setIsOpen((s) => !s)}
          />
        </Flex>
      </Flex>

      <ResponsivePresenter
        isOpen={isOpen}
        desktop="menu"
        mobile="sheet"
        onClose={() => setIsOpen(false)}
        blocking
        focusOnRender={false}
        position={{
          target: ref.current || "mouse",
          align: "start",
          location: "below",
          yOffset: 10,
          isTargetAbsolute: true,
        }}
      >
        <Popup
          title="Image properties"
          onClose={() => {
            setIsOpen(false);
          }}
        >
          <ImageProperties {...props} />
        </Popup>
      </ResponsivePresenter>
    </Flex>
  );
}
