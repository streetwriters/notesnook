import { ToolProps } from "../types";
import { Editor } from "../../types";
import { ToolId } from ".";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";
import { ToolbarLocation, useToolbarLocation } from "../stores/toolbar-store";
import { useMemo } from "react";

const defaultLevels = [1, 2, 3, 4, 5, 6];

export function Headings(props: ToolProps) {
  const { editor } = props;
  const toolbarLocation = useToolbarLocation();

  const currentHeadingLevel = defaultLevels.find((level) =>
    editor.isActive("heading", { level })
  );
  const items = useMemo(
    () => toMenuItems(editor, toolbarLocation, currentHeadingLevel),
    [currentHeadingLevel]
  );

  return (
    <Dropdown
      selectedItem={
        currentHeadingLevel ? `Heading ${currentHeadingLevel}` : "Paragraph"
      }
      items={items}
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
      editor.current
        ?.chain()
        .focus()
        .updateAttributes("textStyle", { fontSize: null, fontStyle: null })
        .setHeading({ level: level as any })
        .run(),
  }));
  const paragraph: MenuItem = {
    key: "paragraph",
    type: "button",
    title: "Paragraph",
    isChecked: !currentHeadingLevel,
    onClick: () => editor.current?.chain().focus().setParagraph().run(),
  };
  return [paragraph, ...menuItems];
}
