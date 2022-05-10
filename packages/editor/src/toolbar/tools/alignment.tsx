import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { ToolId } from ".";
import { IconNames, Icons } from "../icons";

type AlignmentToolProps = ToolProps & {
  alignment: "left" | "right" | "center" | "justify";
};
function AlignmentTool(props: AlignmentToolProps) {
  const { editor, alignment, ...toolProps } = props;

  return (
    <ToolButton
      {...toolProps}
      onClick={() => editor.chain().focus().setTextAlign(alignment).run()}
      toggled={editor.isActive({ textAlign: alignment })}
    />
  );
}

export function AlignCenter(props: ToolProps) {
  return <AlignmentTool alignment="center" {...props} />;
}
export function AlignLeft(props: ToolProps) {
  return <AlignmentTool alignment="left" {...props} />;
}
export function AlignRight(props: ToolProps) {
  return <AlignmentTool alignment="right" {...props} />;
}
export function AlignJustify(props: ToolProps) {
  return <AlignmentTool alignment="justify" {...props} />;
}
