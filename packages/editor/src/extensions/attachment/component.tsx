import { Box, Flex, Text } from "rebass";
import { Attachment } from "./attachment";
import { ToolButton } from "../../toolbar/components/tool-button";
import { Editor } from "@tiptap/core";
import { useRef } from "react";
// import { MenuPresenter } from "../../components/menu/menu";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { ReactNodeViewProps } from "../react";

export function AttachmentComponent(props: ReactNodeViewProps<Attachment>) {
  const { hash, filename, size } = props.node.attrs;

  const { editor } = props;
  const elementRef = useRef<HTMLSpanElement>();
  const isActive = editor.isActive("attachment", { hash });
  // const [isToolbarVisible, setIsToolbarVisible] = useState<boolean>();

  //   useEffect(() => {
  //     setIsToolbarVisible(isActive);
  //   }, [isActive]);

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
          zIndex: 1,
          userSelect: "none",
          alignItems: "center",
          backgroundColor: "bgSecondary",
          px: 1,
          borderRadius: "default",
          border: "1px solid var(--border)",
          cursor: "pointer",
          maxWidth: 250,
          borderColor: isActive ? "primary" : "border",
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
            fontSize: "0.85rem",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
          className="filename"
        >
          {filename}
        </Text>
        <Text
          as="span"
          className="size"
          sx={{
            ml: 1,
            fontSize: "subBody",
            color: "fontTertiary",
            flexShrink: 0,
          }}
        >
          {formatBytes(size)}
        </Text>
      </Box>
      {/* <MenuPresenter
        isOpen={isActive}
        onClose={() => {}}
        items={[]}
        options={{
          type: "autocomplete",
          position: {
            target: elementRef.current || undefined,
            location: "top",
            yOffset: -5,
            isTargetAbsolute: true,
            align: "end",
          },
        }}
      >
        <AttachmentToolbar editor={editor} />
      </MenuPresenter> */}
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
        flexDirection: "column",
        // position: "absolute",
        // top: 0,
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
        <ToolButton
          toggled={false}
          title="Download"
          id="download"
          icon="download"
          onClick={() => {}}
          variant="small"
          sx={{ mr: 1 }}
        />
        <ToolButton
          toggled={false}
          title="delete"
          id="delete"
          icon="delete"
          onClick={() => {}}
          variant="small"
          sx={{ mr: 0 }}
        />
      </Flex>
    </Flex>
  );
}
