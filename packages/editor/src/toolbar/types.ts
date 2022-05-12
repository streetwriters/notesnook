import { Editor } from "@tiptap/core";
import { IconNames } from "./icons";

export type ToolProps = ToolDefinition & {
  editor: Editor;
};

export type ToolDefinition = {
  icon: IconNames;
  title: string;
  description?: string;
};
