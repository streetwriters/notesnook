import { Box, Flex } from "rebass";
import { Resizable } from "re-resizable";
import { useRef } from "react";
import { EmbedAlignmentOptions, EmbedAttributes } from "./embed";
import { SelectionBasedReactNodeViewProps } from "../react";
import { DesktopOnly } from "../../components/responsive";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";

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
                        "embedAlignLeft",
                        "embedAlignCenter",
                        "embedAlignRight",
                        "embedProperties",
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
