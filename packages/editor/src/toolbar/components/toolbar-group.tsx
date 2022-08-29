import { ToolbarGroupDefinition, ToolButtonVariant } from "../types";
import { findTool } from "../tools";
import { Flex, FlexProps } from "@streetwriters/rebass";
import { Editor } from "../../types";
import { MoreTools } from "./more-tools";
import { getToolDefinition } from "../tool-definitions";
import { NodeWithOffset } from "../utils/prosemirror";

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
