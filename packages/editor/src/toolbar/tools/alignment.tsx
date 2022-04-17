import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { ToolId } from ".";
import { IconNames, Icons } from "../icons";

class AlignmentTool<TId extends ToolId, TTitle extends string>
  implements ITool
{
  constructor(
    readonly id: TId,
    readonly title: TTitle,
    private readonly alignment: "left" | "right" | "center" | "justify",
    private readonly icon: IconNames
  ) {}

  render = (props: ToolProps) => {
    const { editor } = props;

    return (
      <ToolButton
        title={this.title}
        id={this.id}
        icon={this.icon}
        onClick={() =>
          editor.chain().focus().setTextAlign(this.alignment).run()
        }
        toggled={editor.isActive({ textAlign: this.alignment })}
      />
    );
  };
}

export class AlignCenter extends AlignmentTool<ToolId, string> {
  constructor() {
    super("alignCenter", "Align center", "center", "alignCenter");
  }
}

export class AlignRight extends AlignmentTool<ToolId, string> {
  constructor() {
    super("alignRight", "Align right", "right", "alignRight");
  }
}

export class AlignLeft extends AlignmentTool<ToolId, string> {
  constructor() {
    super("alignLeft", "Align left", "left", "alignLeft");
  }
}

export class AlignJustify extends AlignmentTool<ToolId, string> {
  constructor() {
    super("alignJustify", "Justify", "justify", "alignJustify");
  }
}
