import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { ToolId } from ".";
import { IconNames } from "../icons";

class TextDirectionTool<TId extends ToolId, TTitle extends string>
  implements ITool
{
  constructor(
    readonly id: TId,
    readonly title: TTitle,
    private readonly icon: IconNames,
    private readonly direction: "ltr" | "rtl"
  ) {}

  render = (props: ToolProps) => {
    const { editor } = props;

    return (
      <ToolButton
        title={this.title}
        id={this.id}
        icon={this.icon}
        onClick={() =>
          editor.chain().focus().setTextDirection(this.direction).run()
        }
        toggled={editor.isActive({ textDirection: this.direction })}
      />
    );
  };
}

export class LeftToRight extends TextDirectionTool<ToolId, string> {
  constructor() {
    super("ltr", "Left-to-right", "ltr", "ltr");
  }
}

export class RightToLeft extends TextDirectionTool<ToolId, string> {
  constructor() {
    super("rtl", "Right-to-left", "rtl", "rtl");
  }
}
