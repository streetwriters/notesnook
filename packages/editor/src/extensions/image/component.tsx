import { Box, Flex, Image, ImageProps, Text } from "rebass";
import { NodeViewWrapper, NodeViewProps, FloatingMenu } from "@tiptap/react";
import {
  ImageAlignmentOptions,
  ImageAttributes,
  ImageSizeOptions,
} from "./image";
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
import { ThemeProvider } from "emotion-theming";
import { Theme, useTheme } from "@notesnook/theme";
import { Resizable } from "re-resizable";
import { ToolButton } from "../../toolbar/components/tool-button";
import { findToolById, ToolId } from "../../toolbar/tools";
import { Editor } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../../toolbar/components/popup";
import { Toggle } from "../../components/toggle";
import { Input } from "@rebass/forms";

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

      {isOpen && (
        <Popup
          title="Image properties"
          action={{
            icon: "close",
            onClick: () => {
              setIsOpen(false);
            },
          }}
        >
          <Flex sx={{ width: 200, flexDirection: "column", p: 1 }}>
            <Flex
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
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
                onChange={(e) =>
                  onSizeChange(undefined, e.target.valueAsNumber)
                }
              />
            </Flex>
          </Flex>
        </Popup>
      )}
    </Flex>
  );
}
