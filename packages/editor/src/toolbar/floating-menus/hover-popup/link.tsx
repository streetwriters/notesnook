import { ToolbarGroup } from "../../components/toolbar-group";
import { HoverPopupProps } from ".";

function LinkHoverPopup(props: HoverPopupProps) {
  const { editor, selectedNode } = props;
  const { node } = selectedNode;

  if (
    !node?.isText ||
    node.marks.length <= 0 ||
    !node.marks.some((mark) => mark.type.name === "link")
  )
    return null;

  return (
    <ToolbarGroup
      force
      tools={["openLink", "editLink", "removeLink"]}
      editor={editor}
      selectedNode={selectedNode}
      sx={{
        bg: "background",
        boxShadow: "menu",
        borderRadius: "default",
        p: 1,
      }}
    />
  );
}

export const LinkHoverPopupHandler = {
  isActive: (e: HTMLElement) => !!e.closest("a"),
  popup: LinkHoverPopup,
};
