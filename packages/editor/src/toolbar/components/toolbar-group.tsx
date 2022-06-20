import { ToolbarGroupDefinition, ToolButtonVariant } from "../types";
import { findTool } from "../tools";
import { Flex, FlexProps } from "rebass";
import { Editor } from "@tiptap/core";
import { MoreTools } from "./more-tools";
import { getToolDefinition } from "../tool-definitions";

export type ToolbarGroupProps = FlexProps & {
  tools: ToolbarGroupDefinition;
  editor: Editor;
  variant?: ToolButtonVariant;
};
export function ToolbarGroup(props: ToolbarGroupProps) {
  const { tools, editor, ...flexProps } = props;
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
              {...toolDefinition}
            />
          );
        }
      })}
    </Flex>
  );
}
