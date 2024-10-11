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
import { IconNames } from "../icons.js";
import { useRefValue } from "../../hooks/use-ref-value.js";
import {
  getTextDirection,
  TextDirections
} from "../../extensions/text-direction/index.js";
import { CodeBlock } from "../../extensions/code-block/index.js";

type TextDirectionToolProps = ToolProps & {
  direction: TextDirections;
};
function TextDirectionTool(props: TextDirectionToolProps) {
  const { editor, direction, ...toolProps } = props;
  const directionRef = useRefValue(direction);

  return (
    <ToolButton
      {...toolProps}
      onClick={() =>
        editor.chain().focus().setTextDirection(directionRef.current).run()
      }
      disabled={editor.isActive(CodeBlock.name)}
      toggled={false}
    />
  );
}

export function TextDirection(props: ToolProps) {
  const { editor } = props;
  const textDirection = getTextDirection(editor);

  const newTextDirection: TextDirections = textDirection ? undefined : "rtl";

  const icon: IconNames = textDirection ? "rtl" : "ltr";

  return (
    <TextDirectionTool direction={newTextDirection} {...props} icon={icon} />
  );
}
