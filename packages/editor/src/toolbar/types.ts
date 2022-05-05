import { Editor } from "@tiptap/core";
import { IconNames } from "./icons";
import { ToolId } from "./tools";

export type ToolProps = ToolDefinition & {
  editor: Editor;
  id: ToolId;
};

export type ToolDefinition = {
  icon: IconNames;
  title: string;
  description?: string;
};
