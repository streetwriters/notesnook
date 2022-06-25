import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { useToolbarLocation } from "../stores/toolbar-store";

export function Italic(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("italic")}
      onClick={() => editor.current?.chain().focus().toggleItalic().run()}
    />
  );
}

export function Strikethrough(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("strike")}
      onClick={() => editor.current?.chain().focus().toggleStrike().run()}
    />
  );
}

export function Underline(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("underline")}
      onClick={() => editor.current?.chain().focus().toggleUnderline().run()}
    />
  );
}

export function Code(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("code")}
      onClick={() => editor.current?.chain().focus().toggleCode().run()}
    />
  );
}

export function Bold(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("bold")}
      onClick={() => editor.current?.chain().focus().toggleBold().run()}
    />
  );
}

export function Subscript(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("subscript")}
      onClick={() => editor.current?.chain().focus().toggleSubscript().run()}
    />
  );
}

export function Superscript(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("superscript")}
      onClick={() => editor.current?.chain().focus().toggleSuperscript().run()}
    />
  );
}

export function ClearFormatting(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .clearNodes()
          .unsetAllMarks()
          .unsetMark("link")
          .run()
      }
    />
  );
}

export function CodeRemove(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("code") || !isBottom) return null;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => editor.current?.chain().focus().unsetMark("code").run()}
    />
  );
}
