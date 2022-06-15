import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolId } from ".";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";

const defaultLevels = [1, 2, 3, 4, 5, 6];

export function Headings(props: ToolProps) {
  const { editor } = props;

  const currentHeadingLevel = defaultLevels.find((level) =>
    editor.isActive("heading", { level })
  );
  return (
    <Dropdown
      selectedItem={
        currentHeadingLevel ? `Heading ${currentHeadingLevel}` : "Paragraph"
      }
      items={toMenuItems(editor, currentHeadingLevel)}
      menuWidth={130}
    />
  );
}

function toMenuItems(editor: Editor, currentHeadingLevel?: number): MenuItem[] {
  const menuItems: MenuItem[] = defaultLevels.map((level) => ({
    type: "button",
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
    type: "button",
    title: "Paragraph",
    isChecked: !currentHeadingLevel,
    onClick: () => editor.chain().focus().setParagraph().run(),
  };
  return [paragraph, ...menuItems];
}
