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

import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { IconNames } from "../icons";
import { useRefValue } from "../../hooks/use-ref-value";

type TextDirection = "ltr" | "rtl";
type TextDirectionToolProps = ToolProps & {
  direction: TextDirection;
};
function TextDirectionTool(props: TextDirectionToolProps) {
  const { editor, direction, ...toolProps } = props;
  const directionRef = useRefValue(direction);

  return (
    <ToolButton
      {...toolProps}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .setTextDirection(directionRef.current)
          .run()
      }
      toggled={false}
    />
  );
}

export function TextDirection(props: ToolProps) {
  const { editor } = props;
  const { textDirection } = {
    ...editor.getAttributes("paragraph"),
    ...editor.getAttributes("heading")
  } as { textDirection: TextDirection };

  const newTextDirection: TextDirection =
    textDirection === "ltr" ? "rtl" : "ltr";

  const icon: IconNames = textDirection === "ltr" ? "ltr" : "rtl";

  return (
    <TextDirectionTool direction={newTextDirection} {...props} icon={icon} />
  );
}
