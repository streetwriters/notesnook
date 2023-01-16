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

import { ToolbarGroupDefinition, ToolButtonVariant } from "../types";
import { findTool } from "../tools";
import { Flex, FlexProps } from "@theme-ui/components";
import { Editor } from "../../types";
import { MoreTools } from "./more-tools";
import { getToolDefinition } from "../tool-definitions";
import { NodeWithOffset } from "../../utils/prosemirror";

export type ToolbarGroupProps = FlexProps & {
  tools: ToolbarGroupDefinition;
  editor: Editor;
  variant?: ToolButtonVariant;
  force?: boolean;
  selectedNode?: NodeWithOffset;
};
export function ToolbarGroup(props: ToolbarGroupProps) {
  const { tools, editor, force, selectedNode, ...flexProps } = props;

  return (
    <Flex className="toolbar-group" {...flexProps}>
      {tools.map((toolId) => {
        if (Array.isArray(toolId)) {
          return (
            <MoreTools
              key={"more-tools"}
              title="More"
              icon="more"
              popupId={toolId.join("")}
              tools={toolId}
              editor={editor}
            />
          );
        } else {
          const Component = findTool(toolId);
          const toolDefinition = getToolDefinition(toolId);
          return (
            <Component
              key={toolDefinition.title}
              editor={editor}
              force={force}
              selectedNode={selectedNode}
              {...toolDefinition}
            />
          );
        }
      })}
    </Flex>
  );
}
