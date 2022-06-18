import { Box, Flex, Text } from "rebass";
import { AttachmentWithProgress } from "./attachment";
import { ToolButton } from "../../toolbar/components/tool-button";
import { Editor } from "@tiptap/core";
import { useRef } from "react";
// import { MenuPresenter } from "../../components/menu/menu";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { SelectionBasedReactNodeViewProps } from "../react";
import { PopupPresenter } from "../../components/popup-presenter";

export function AttachmentComponent(
  props: SelectionBasedReactNodeViewProps<AttachmentWithProgress>
) {
  const { editor, node, selected } = props;
  const { hash, filename, size, progress } = node.attrs;
  const elementRef = useRef<HTMLSpanElement>();
  // const isActive = editor.isActive("attachment", { hash });
  // const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>();

  //   useEffect(() => {
  //     setIsToolbarVisible(isActive);
  //   }, [isActive]);
  console.log(progress);
  return (
    <>
      <Box
        ref={elementRef}
        as="span"
        contentEditable={false}
        variant={"body"}
        sx={{
          display: "inline-flex",
          overflow: "hidden",
          position: "relative",
          justifyContent: "center",
          zIndex: 1,
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
            bg: "hover",
          },
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
            overflow: "hidden",
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
            flexShrink: 0,
          }}
        >
          {progress ? `${progress}%` : formatBytes(size)}
        </Text>
      </Box>
      <PopupPresenter
        isOpen={selected}
        onClose={() => {}}
        blocking={false}
        focusOnRender={false}
        position={{
          target: elementRef.current || undefined,
          align: "center",
          location: "top",
          yOffset: 5,
          isTargetAbsolute: true,
        }}
      >
        <AttachmentToolbar editor={editor} />
      </PopupPresenter>
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

type AttachmentToolbarProps = {
  editor: Editor;
};

// TODO make this functional
function AttachmentToolbar(props: AttachmentToolbarProps) {
  const { editor } = props;

  return (
    <Flex
      sx={{
        bg: "background",
        boxShadow: "menu",
        flexWrap: "nowrap",
        borderRadius: "default",
      }}
    >
      <ToolButton
        toggled={false}
        title="Download"
        id="download"
        icon="download"
        onClick={() => {}}
        sx={{ mr: 1 }}
      />
      <ToolButton
        toggled={false}
        title="delete"
        id="delete"
        icon="delete"
        onClick={() => {}}
        sx={{ mr: 0 }}
      />
    </Flex>
  );
}
