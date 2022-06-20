import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolId } from ".";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";
import { ToolbarLocation, useToolbarLocation } from "../stores/toolbar-store";

const defaultLevels = [1, 2, 3, 4, 5, 6];

export function Headings(props: ToolProps) {
  const { editor } = props;
  const toolbarLocation = useToolbarLocation();

  const currentHeadingLevel = defaultLevels.find((level) =>
    editor.isActive("heading", { level })
  );
  return (
    <Dropdown
      selectedItem={
        currentHeadingLevel ? `Heading ${currentHeadingLevel}` : "Paragraph"
      }
      items={toMenuItems(editor, toolbarLocation, currentHeadingLevel)}
      menuWidth={130}
    />
  );
}

function toMenuItems(
  editor: Editor,
  toolbarLocation: ToolbarLocation,
  currentHeadingLevel?: number
): MenuItem[] {
  const menuItems: MenuItem[] = defaultLevels.map((level) => ({
    type: "button",
    key: `heading-${level}`,
    title: toolbarLocation === "bottom" ? `H${level}` : `Heading ${level}`,
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
