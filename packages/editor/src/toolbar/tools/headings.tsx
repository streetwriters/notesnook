import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolId } from ".";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";

export class Headings implements ITool {
  title = "Headings";
  id: ToolId = "headings";
  private defaultLevels = [1, 2, 3, 4, 5, 6];

  render = (props: ToolProps) => {
    const { editor } = props;

    const currentHeadingLevel = this.defaultLevels.find((level) =>
      editor.isActive("heading", { level })
    );
    return (
      <Dropdown
        selectedItem={
          currentHeadingLevel ? `Heading ${currentHeadingLevel}` : "Paragraph"
        }
        items={this.toMenuItems(editor, currentHeadingLevel)}
      />
    );
  };

  private toMenuItems(
    editor: Editor,
    currentHeadingLevel?: number
  ): MenuItem[] {
    const menuItems: MenuItem[] = this.defaultLevels.map((level) => ({
      type: "menuitem",
      key: `heading-${level}`,
      title: `Heading ${level}`,
      isChecked: level === currentHeadingLevel,
      onClick: () =>
        editor
          .chain()
          .focus()
          .setHeading({ level: level as any })
          .run(),
    }));
    const paragraph: MenuItem = {
      key: "paragraph",
      type: "menuitem",
      title: "Paragraph",
      isChecked: !currentHeadingLevel,
      onClick: () => editor.chain().focus().setParagraph().run(),
    };
    return [paragraph, ...menuItems];
  }
}
