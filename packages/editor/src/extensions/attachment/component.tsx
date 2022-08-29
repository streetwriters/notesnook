import { Box, Text } from "@streetwriters/rebass";
import { AttachmentWithProgress } from "./attachment";
import { useRef } from "react";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { SelectionBasedReactNodeViewProps } from "../react";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import { DesktopOnly } from "../../components/responsive";

export function AttachmentComponent(
  props: SelectionBasedReactNodeViewProps<AttachmentWithProgress>
) {
  const { editor, node, selected } = props;
  const { filename, size, progress } = node.attrs;
  const elementRef = useRef<HTMLSpanElement>();

  return (
    <>
      <Box
        ref={elementRef}
        as="span"
        contentEditable={false}
        variant={"body"}
        sx={{
          display: "inline-flex",
          position: "relative",
          justifyContent: "center",
          userSelect: "none",
          alignItems: "center",
          backgroundColor: "bgSecondary",
          px: 1,
          borderRadius: "default",
          border: "1px solid var(--border)",
          cursor: "pointer",
          maxWidth: 250,
          borderColor: selected ? "primary" : "border",
          ":hover": {
            bg: "hover"
          }
        }}
        title={filename}
      >
        <Icon path={Icons.attachment} size={14} />
        <Text
          as="span"
          sx={{
            ml: "small",
            fontSize: "body",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}
        >
          {filename}
        </Text>
        <Text
          as="span"
          sx={{
            ml: 1,
            fontSize: "0.65rem",
            color: "fontTertiary",
            flexShrink: 0
          }}
        >
          {progress ? `${progress}%` : formatBytes(size)}
        </Text>
        <DesktopOnly>
          {selected && (
            <ToolbarGroup
              editor={editor}
              tools={["removeAttachment", "downloadAttachment"]}
              sx={{
                boxShadow: "menu",
                borderRadius: "default",
                bg: "background",
                position: "absolute",
                top: -35
              }}
            />
          )}
        </DesktopOnly>
      </Box>
    </>
  );
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
