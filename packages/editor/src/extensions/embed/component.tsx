import { Box, Flex } from "rebass";
import { useRef, useState } from "react";
import { EmbedAlignmentOptions, EmbedAttributes } from "./embed";
import { SelectionBasedReactNodeViewProps } from "../react";
import { DesktopOnly } from "../../components/responsive";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import { Icon, Icons } from "../../toolbar";
import { Resizer } from "../../components/resizer";

export function EmbedComponent(
  props: SelectionBasedReactNodeViewProps<
    EmbedAttributes & EmbedAlignmentOptions
  >
) {
  const { editor, updateAttributes, selected, node } = props;
  const [isLoading, setIsLoading] = useState(true);
  const embedRef = useRef<HTMLIFrameElement>();
  const { src, width, height, align } = node.attrs;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent:
            align === "center" ? "center" : align === "left" ? "start" : "end",
          position: "relative"
        }}
      >
        <Resizer
          handleColor="primary"
          editor={editor}
          selected={selected}
          width={width}
          height={height}
          onResize={(width, height) => {
            updateAttributes(
              {
                width,
                height
              },
              { addToHistory: true, preventUpdate: false }
            );
          }}
        >
          <Box
            width={"100%"}
            sx={{
              display: editor.isEditable ? "flex" : "none",
              position: "absolute",
              top: -24,
              justifyContent: "end",
              p: "small",
              bg: editor.isEditable ? "bgSecondary" : "transparent",
              borderTopLeftRadius: "default",
              borderTopRightRadius: "default",
              borderColor: selected ? "border" : "bgSecondary",
              cursor: "pointer",
              ":hover": {
                borderColor: "border"
              }
            }}
          >
            <Icon path={Icons.dragHandle} size={"big"} />
            <DesktopOnly>
              {selected && (
                <Flex sx={{ position: "relative", justifyContent: "end" }}>
                  <Flex
                    sx={{
                      position: "absolute",
                      top: -10,
                      mb: 2,
                      alignItems: "end"
                    }}
                  >
                    <ToolbarGroup
                      editor={editor}
                      tools={[
                        "embedAlignLeft",
                        "embedAlignCenter",
                        "embedAlignRight",
                        "embedProperties"
                      ]}
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
          </Box>
          <Box
            as="iframe"
            ref={embedRef}
            src={src}
            width={"100%"}
            height={"100%"}
            sx={{
              bg: "bgSecondary",
              border: selected
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              borderRadius: "default"
            }}
            onLoad={() => setIsLoading(false)}
            {...props}
          />
          {isLoading && (
            <Flex
              sx={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                height: "calc(100% - 20px)",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Icon path={Icons.loading} rotate size={32} color="disabled" />
            </Flex>
          )}
        </Resizer>
      </Box>
    </>
  );
}
