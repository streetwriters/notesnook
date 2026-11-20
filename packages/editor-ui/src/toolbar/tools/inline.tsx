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

import { q } from "../../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../../queries/use-query.js";
import { ToolProps } from "../types.js";
import { ToolButton } from "../components/tool-button.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { NODE_NAMES } from "../../extension-types.js";

export function Italic(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("italic"), false);
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={isActive}
      onClick={() => editor.run({ name: "toggleItalic" })}
    />
  );
}

export function Strikethrough(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("strike"), false);
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={isActive}
      onClick={() => editor.run({ name: "toggleStrike" })}
    />
  );
}

export function Underline(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("underline"), false);
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={isActive}
      onClick={() => editor.run({ name: "toggleUnderline" })}
    />
  );
}

export function Code(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("code"), false);
  const inCodeBlock = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.codeBlock),
    false
  );

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={isActive}
      disabled={inCodeBlock}
      onClick={() => editor.run({ name: "toggleCode" })}
    />
  );
}

export function Bold(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("bold"), false);

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={isActive}
      onClick={() => editor.run({ name: "toggleBold" })}
    />
  );
}

export function Subscript(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("subscript"), false);
  const inCodeBlock = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.codeBlock),
    false
  );
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={isActive}
      disabled={inCodeBlock}
      onClick={() => editor.run({ name: "toggleSubscript" })}
    />
  );
}

export function Superscript(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("superscript"), false);
  const inCodeBlock = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.codeBlock),
    false
  );
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={isActive}
      disabled={inCodeBlock}
      onClick={() => editor.run({ name: "toggleSuperscript" })}
    />
  );
}

export function ClearFormatting(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={false}
      onClick={() =>
        editor.run(
          { name: "unsetAllMarks" },
          { name: "unsetMark", args: ["link"] }
        )
      }
    />
  );
}

export function CodeRemove(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("code"), false);
  const isBottom = useToolbarLocation() === "bottom";
  if (!isActive || !isBottom) return null;
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={false}
      onClick={() => editor.run({ name: "unsetMark", args: ["code"] })}
    />
  );
}

export function Math(props: ToolProps) {
  const { editor } = props;
  const inCodeBlock = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.codeBlock),
    false
  );
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={false}
      onClick={() => editor.run({ name: "insertMathInline" })}
      disabled={inCodeBlock}
    />
  );
}
