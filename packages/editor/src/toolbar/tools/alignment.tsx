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
import { useRefValue } from "../../hooks/use-ref-value.js";
import { IconNames } from "../icons.js";
import { CodeBlock } from "../../extensions/code-block/index.js";

type Alignment = "left" | "right" | "center" | "justify";
type AlignmentToolProps = ToolProps & {
  alignment: Alignment;
};
function AlignmentTool(props: AlignmentToolProps) {
  const { editor, alignment, ...toolProps } = props;
  const alignmentRef = useRefValue(alignment);

  return (
    <ToolButton
      {...toolProps}
      onClick={() => {
        editor.chain().focus().setTextAlign(alignmentRef.current).run();
      }}
      disabled={editor.isActive(CodeBlock.name)}
      toggled={false}
    />
  );
}

export function Alignment(props: ToolProps) {
  const { editor } = props;
  const { textAlign } = {
    ...editor.getAttributes("paragraph"),
    ...editor.getAttributes("heading")
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
