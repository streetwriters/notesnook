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

import { Flex, type SxProp } from "@ui";
import { ToolbarGroupDefinition, ToolButtonVariant } from "../types.js";
import { findTool } from "../tools/index.js";
import { MoreTools } from "./more-tools.js";
import { getToolDefinition } from "../tool-definitions.js";
import { strings } from "@notesnook/intl";
import type { EditorController } from "../../controller.js";

export type ControllerToolbarGroupProps = {
  tools: ToolbarGroupDefinition;
  editor: EditorController;
  variant?: ToolButtonVariant;
  force?: boolean;
  groupId: string;
  sx?: SxProp;
  testID?: string;
  className?: string;
};
export function ControllerToolbarGroup(props: ControllerToolbarGroupProps) {
  const { tools, force, sx, groupId, testID, editor } = props;

  return (
    <Flex
      testID={testID}
      sx={{
        flexDirection: "row",
        alignItems: "center",
        p: 1,
        flexShrink: 0,
        ...sx
      }}
    >
      {tools.map((toolId) => {
        if (Array.isArray(toolId)) {
          return (
            <MoreTools
              parentGroup={groupId}
              key={"more-tools"}
              title={strings.more()}
              icon="more"
              popupId={toolId.join("")}
              tools={toolId}
              editor={editor}
            />
          );
        } else {
          const Component = findTool(toolId, editor);
          const toolDefinition = getToolDefinition(toolId);
          return (
            <Component
              parentGroup={groupId}
              key={toolDefinition.title}
              editor={editor}
              force={force}
              {...toolDefinition}
            />
          );
        }
      })}
    </Flex>
  );
}
