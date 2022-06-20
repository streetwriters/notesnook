import { ToolbarGroup } from "../components/toolbar-group";
import { FloatingMenuProps } from "./types";

export function ImageToolbar(props: FloatingMenuProps) {
  const { editor } = props;

  return (
    <ToolbarGroup
      editor={editor}
      tools={[
        "imageAlignLeft",
        "imageAlignCenter",
        "imageAlignRight",
        "imageProperties",
      ]}
      sx={{
        boxShadow: "menu",
        borderRadius: "default",
        bg: "background",
      }}
    />
  );
}
