import { Editor } from "@tiptap/core";
import { IconNames } from "./icons";
import { ToolId } from "./tools";

export type ToolProps = ToolDefinition & {
  editor: Editor;
  variant?: "small" | "normal";
};

export type ToolDefinition = {
  icon: IconNames;
  title: string;
  conditional?: boolean;
  description?: string;
};

export type ToolbarGroupDefinition = (ToolId | ToolId[])[];

export type ToolbarDefinition = ToolbarGroupDefinition[];
