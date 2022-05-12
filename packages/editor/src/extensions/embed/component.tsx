import { Box, Button, Flex, Image, ImageProps, Text } from "rebass";
import { NodeViewWrapper, NodeViewProps, FloatingMenu } from "@tiptap/react";
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
import { ThemeProvider } from "emotion-theming";
import { Theme, useTheme } from "@notesnook/theme";
import { Resizable } from "re-resizable";
import { ToolButton } from "../../toolbar/components/tool-button";
import { findToolById, ToolId } from "../../toolbar/tools";
import { Editor } from "@tiptap/core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionSheetPresenter,
  MenuPresenter,
  PopupPresenter,
} from "../../components/menu/menu";
import { Popup } from "../../toolbar/components/popup";
import { Toggle } from "../../components/toggle";
import { Input } from "@rebass/forms";
import {
  EmbedAlignmentOptions,
  EmbedAttributes,
  EmbedSizeOptions,
} from "./embed";
import { EmbedPopup } from "../../toolbar/popups/embed-popup";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { DesktopOnly, MobileOnly } from "../../components/responsive";

export function EmbedComponent(props: NodeViewProps) {
  const { src, width, height, align } = props.node.attrs as EmbedAttributes &
    EmbedAlignmentOptions;

  const { editor, updateAttributes } = props;
  const embedRef = useRef<HTMLIFrameElement>();
  const isActive = editor.isActive("embed", { src });
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
            display: "flex",
            justifyContent:
              align === "center"
                ? "center"
                : align === "left"
                ? "start"
                : "end",
          }}
        >
          <Resizable
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
            {/* <Flex sx={{ position: "relative", justifyContent: "end" }}>
              
            </Flex> */}
            <Flex
              width={"100%"}
              sx={{
                position: "relative",
                justifyContent: "end",
                borderTop: "20px solid var(--bgSecondary)",
                // borderLeft: "20px solid var(--bgSecondary)",
                borderTopLeftRadius: "default",
                borderTopRightRadius: "default",
                borderColor: isActive ? "border" : "bgSecondary",
                cursor: "pointer",
                ":hover": {
                  borderColor: "border",
                },
              }}
            >
              {isToolbarVisible && (
                <EmbedToolbar
                  editor={editor}
                  align={align}
                  height={height || 0}
                  width={width || 0}
                  src={src}
                />
              )}
            </Flex>
            <Box
              as="iframe"
              ref={embedRef}
              src={src}
              width={"100%"}
              height={"100%"}
              sx={{
                border: "none",
                // border: isActive
                //   ? "2px solid var(--primary)"
                //   : "2px solid transparent",
                // borderRadius: "default",
              }}
              {...props}
            />
          </Resizable>
        </Box>
      </ThemeProvider>
    </NodeViewWrapper>
  );
}

type ImageToolbarProps = Required<EmbedAttributes> &
  EmbedAlignmentOptions & {
    editor: Editor;
  };

function EmbedToolbar(props: ImageToolbarProps) {
  const { editor, height, width, src } = props;
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
              editor.chain().focus().setEmbedAlignment({ align: "left" }).run()
            }
          />

          <ToolButton
            toggled={false}
            title="Align center"
            id="alignCenter"
            icon="alignCenter"
            onClick={() =>
              editor
                .chain()
                .focus()
                .setEmbedAlignment({ align: "center" })
                .run()
            }
          />

          <ToolButton
            toggled={false}
            title="Align right"
            id="alignRight"
            icon="alignRight"
            onClick={() =>
              editor.chain().focus().setEmbedAlignment({ align: "right" }).run()
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
            title="Embed properties"
            id="embedProperties"
            icon="more"
            onClick={() => setIsOpen((s) => !s)}
          />
        </Flex>
      </Flex>

      <PopupPresenter
        isOpen={isOpen}
        desktop="none"
        mobile="sheet"
        onClose={() => setIsOpen(false)}
        blocking={true}
      >
        <EmbedPopup
          title="Embed properties"
          icon="close"
          onClose={() => setIsOpen(false)}
          embed={props}
          onSourceChanged={(src) => {}}
          onSizeChanged={(size) => editor.commands.setEmbedSize(size)}
        />
      </PopupPresenter>
    </Flex>
  );
}
