import { Editor } from "../types";
import { IconNames } from "./icons";
import { ToolId } from "./tools";
import { NodeWithOffset } from "./utils/prosemirror";

export type ToolButtonVariant = "small" | "normal";
export type ToolProps = ToolDefinition & {
  editor: Editor;
  variant?: ToolButtonVariant;
  force?: boolean;
  selectedNode?: NodeWithOffset;
};

export type ToolDefinition = {
  icon: IconNames;
  title: string;
  conditional?: boolean;
  description?: string;
};

export type ToolbarGroupDefinition = (ToolId | ToolId[])[];

export type ToolbarDefinition = ToolbarGroupDefinition[];
