/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { ToolProps } from "../types.js";
import { ToolButton } from "../components/tool-button.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { CodeBlock } from "../../extensions/code-block/index.js";

export function Italic(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("italic")}
      onClick={() => editor.chain().focus().toggleItalic().run()}
    />
  );
}

export function Strikethrough(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("strike")}
      onClick={() => editor.chain().focus().toggleStrike().run()}
    />
  );
}

export function Underline(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("underline")}
      onClick={() => editor.chain().focus().toggleUnderline().run()}
    />
  );
}

export function Code(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("code")}
      disabled={editor.isActive(CodeBlock.name)}
      onClick={() => editor.chain().focus().toggleCode().run()}
    />
  );
}

export function Bold(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("bold")}
      onClick={() => editor.chain().focus().toggleBold().run()}
    />
  );
}

export function Subscript(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("subscript")}
      disabled={editor.isActive(CodeBlock.name)}
      onClick={() => editor.chain().focus().toggleSubscript().run()}
    />
  );
}

export function Superscript(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("superscript")}
      disabled={editor.isActive(CodeBlock.name)}
      onClick={() => editor.chain().focus().toggleSuperscript().run()}
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
        editor
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
      onClick={() => editor.chain().focus().unsetMark("code").run()}
    />
  );
}

export function Math(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => editor.chain().focus().insertMathInline().run()}
      disabled={editor.isActive(CodeBlock.name)}
    />
  );
}
