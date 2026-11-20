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
import { IconNames } from "../icons.js";
import { useRefValue } from "../../hooks/use-ref-value.js";
import { NODE_NAMES, TextDirections } from "../../extension-types.js";

type TextDirectionToolProps = ToolProps & {
  direction: TextDirections;
};
function TextDirectionTool(props: TextDirectionToolProps) {
  const { editor, direction } = props;
  const inCodeBlock = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.codeBlock),
    false
  );
  const directionRef = useRefValue(direction);

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      onClick={() =>
        editor.run({ name: "setTextDirection", args: [directionRef.current] })
      }
      disabled={inCodeBlock}
      toggled={false}
    />
  );
}

export function TextDirection(props: ToolProps) {
  const { editor } = props;
  const textDirection = useEditorQuery(editor, q.textDirection());

  const newTextDirection: TextDirections = textDirection ? undefined : "rtl";

  const icon: IconNames = textDirection ? "rtl" : "ltr";

  return (
    <TextDirectionTool direction={newTextDirection} {...props} icon={icon} />
  );
}
