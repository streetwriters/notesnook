import { Editor } from "../../types";
import { MenuButton } from "../../components/menu/types";
import { ToolButton } from "../components/tool-button";
import { ToolProps } from "../types";

export function menuButtonToTool(
  constructItem: (editor: Editor) => MenuButton
) {
  return function (props: ToolProps) {
    const item = constructItem(props.editor);
    return (
      <ToolButton
        {...props}
        icon={item.icon || props.icon}
        toggled={item.isChecked || false}
        title={item.title}
        onClick={item.onClick}
      />
    );
  };
}
