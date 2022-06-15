import { Box, Flex } from "rebass";
import { ThemeProvider } from "emotion-theming";
import { Theme } from "@notesnook/theme";
import { Resizable } from "re-resizable";
import { ToolButton } from "../../toolbar/components/tool-button";
import { Editor } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { EmbedAlignmentOptions, EmbedAttributes } from "./embed";
import { EmbedPopup } from "../../toolbar/popups/embed-popup";
import { SelectionBasedReactNodeViewProps } from "../react";
import { ResponsivePresenter } from "../../components/responsive";

export function EmbedComponent(
  props: SelectionBasedReactNodeViewProps<
    EmbedAttributes & EmbedAlignmentOptions
  >
) {
  const { editor, updateAttributes, selected, node } = props;
  const embedRef = useRef<HTMLIFrameElement>();
  const { src, width, height, align } = node.attrs;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent:
            align === "center" ? "center" : align === "left" ? "start" : "end",
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
              borderColor: selected ? "border" : "bgSecondary",
              cursor: "pointer",
              ":hover": {
                borderColor: "border",
              },
            }}
          >
            {selected && (
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
    </>
  );
}

type ImageToolbarProps = Required<EmbedAttributes> &
  EmbedAlignmentOptions & {
    editor: Editor;
  };

function EmbedToolbar(props: ImageToolbarProps) {
  const { editor, height, width, src } = props;
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
        <EmbedPopup
          title="Embed properties"
          onClose={() => setIsOpen(false)}
          embed={props}
          onSourceChanged={(src) => {}}
          onSizeChanged={(size) => editor.commands.setEmbedSize(size)}
        />
      </ResponsivePresenter>
    </Flex>
  );
}
