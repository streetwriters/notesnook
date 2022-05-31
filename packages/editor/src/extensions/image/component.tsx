import { Box, Flex, Image, ImageProps } from "rebass";
import { NodeViewWrapper, NodeViewProps } from "../react";
import {
  ImageAlignmentOptions,
  ImageAttributes,
  ImageSizeOptions,
} from "./image";
import { ThemeProvider } from "emotion-theming";
import { Theme } from "@notesnook/theme";
import { Resizable } from "re-resizable";
import { ToolButton } from "../../toolbar/components/tool-button";
import { Editor } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { PopupPresenter } from "../../components/menu/menu";
import { Popup } from "../../toolbar/components/popup";
import { ImageProperties } from "../../toolbar/popups/image-properties";

export function ImageComponent(props: ImageProps & NodeViewProps) {
  const { src, alt, title, width, height, align, float } = props.node
    .attrs as ImageAttributes & ImageAlignmentOptions;

  const { editor, updateAttributes } = props;
  const imageRef = useRef<HTMLImageElement>();
  const isActive = editor.isActive("image", { src });
  const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>();
  const theme = editor.storage.theme as Theme;

  useEffect(() => {
    setIsToolbarVisible(isActive);
  }, [isActive]);

  return (
    <NodeViewWrapper>
      <ThemeProvider theme={theme}>
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
            <Flex sx={{ position: "relative", justifyContent: "end" }}>
              {isToolbarVisible && (
                <ImageToolbar
                  editor={editor}
                  float={float}
                  align={align}
                  height={height || 0}
                  width={width || 0}
                />
              )}
            </Flex>
            <Image
              ref={imageRef}
              src={src}
              alt={alt}
              title={title}
              width={"100%"}
              height={"100%"}
              sx={{
                border: isActive
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
                borderRadius: "default",
              }}
              {...props}
            />
          </Resizable>
        </Box>
      </ThemeProvider>
    </NodeViewWrapper>
  );
}

type ImageToolbarProps = ImageAlignmentOptions &
  Required<ImageSizeOptions> & {
    editor: Editor;
  };

function ImageToolbar(props: ImageToolbarProps) {
  const { editor, float, height, width } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Flex
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

      <PopupPresenter
        mobile="sheet"
        desktop="none"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        blocking={false}
      >
        <Popup
          title="Image properties"
          action={{
            icon: "close",
            onClick: () => {
              setIsOpen(false);
            },
          }}
        >
          <ImageProperties {...props} />
        </Popup>
      </PopupPresenter>
    </Flex>
  );
}
