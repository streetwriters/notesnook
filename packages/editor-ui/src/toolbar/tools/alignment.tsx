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

import { q, useEditorQuery } from "../../queries/index.js";
import { ToolProps } from "../types.js";
import { ToolButton } from "../components/tool-button.js";
import { useRefValue } from "../../hooks/use-ref-value.js";
import { IconNames } from "../icons.js";
import { NODE_NAMES } from "../../extension-types.js";

type Alignment = "left" | "right" | "center" | "justify";
type AlignmentToolProps = ToolProps & {
  alignment: Alignment;
};
function AlignmentTool(props: AlignmentToolProps) {
  const { editor, alignment } = props;
  const inCodeBlock = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.codeBlock),
    false
  );
  const alignmentRef = useRefValue(alignment);

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      onClick={() => {
        editor.chain().focus().setTextAlign(alignmentRef.current).run();
      }}
      disabled={inCodeBlock}
      toggled={false}
    />
  );
}

export function Alignment(props: ToolProps) {
  const { editor } = props;
  const paragraph = useEditorQuery(editor, q.attributes("paragraph"), {});
  const heading = useEditorQuery(editor, q.attributes("heading"), {});
  const { textAlign } = {
    ...paragraph,
    ...heading
  } as { textAlign: Alignment };

  const newAlignment: Alignment =
    textAlign === "left"
      ? "center"
      : textAlign === "center"
      ? "right"
      : textAlign === "right"
      ? "justify"
      : textAlign === "justify"
      ? "left"
      : "left";

  const icon: IconNames =
    textAlign === "center"
      ? "alignCenter"
      : textAlign === "justify"
      ? "alignJustify"
      : textAlign === "right"
      ? "alignRight"
      : "alignLeft";

  return <AlignmentTool alignment={newAlignment} {...props} icon={icon} />;
}
