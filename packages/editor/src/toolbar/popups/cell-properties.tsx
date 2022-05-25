import { Slider } from "@rebass/forms";
import { Editor } from "@tiptap/core";
import { useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { ToolButton } from "../components/tool-button";
import { IconNames } from "../icons";

type CellPropertiesProps = { editor: Editor; onClose: () => void };
export function CellProperties(props: CellPropertiesProps) {
  const { editor, onClose } = props;
  const attributes = editor.getAttributes("tableCell");
  return (
    <Popup
      title="Cell properties"
      action={{
        icon: "close",
        iconColor: "error",
        onClick: onClose,
      }}
    >
      <Flex sx={{ flexDirection: "column", px: 1, mb: 2 }}>
        <ColorPickerTool
          color={attributes.backgroundColor}
          title="Background color"
          icon="backgroundColor"
          onColorChange={(color) =>
            editor.commands.setCellAttribute("backgroundColor", color)
          }
        />
        <ColorPickerTool
          color={attributes.color}
          title="Text color"
          icon="textColor"
          onColorChange={(color) =>
            editor.commands.setCellAttribute("color", color)
          }
        />
        <ColorPickerTool
          color={attributes.borderColor}
          title="Border color"
          icon="borderColor"
          onColorChange={(color) =>
            editor.commands.setCellAttribute("borderColor", color)
          }
        />
        <Flex sx={{ flexDirection: "column" }}>
          <Flex
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1,
            }}
          >
            <Text variant={"body"}>Border width</Text>
            <Text variant={"body"}>{attributes.borderWidth || 1}px</Text>
          </Flex>
          <Slider
            min={1}
            max={5}
            value={attributes.borderWidth || 1}
            onChange={(e) => {
              editor.commands.setCellAttribute(
                "borderWidth",
                e.target.valueAsNumber
              );
            }}
          />
        </Flex>
      </Flex>
    </Popup>
  );
}
type ColorPickerToolProps = {
  color: string;
  title: string;
  icon: IconNames;
  onColorChange: (color?: string) => void;
};
function ColorPickerTool(props: ColorPickerToolProps) {
  const { color, title, icon, onColorChange } = props;
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Flex
        sx={{ justifyContent: "space-between", alignItems: "center", mt: 1 }}
      >
        <Text variant={"body"}>{title}</Text>
        <ToolButton
          buttonRef={buttonRef}
          toggled={isOpen}
          title={title}
          id={icon}
          icon={icon}
          variant="small"
          sx={{
            borderRadius: "small",
            backgroundColor: color || "transparent",
            ":hover": { bg: color, filter: "brightness(90%)" },
          }}
          onClick={() => setIsOpen(true)}
        />
      </Flex>

      <MenuPresenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={[]}
        options={{
          type: "menu",
          position: {
            target: buttonRef.current || undefined,
            location: "below",
            align: "center",
            isTargetAbsolute: true,
            yOffset: 5,
          },
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            bg: "background",
            boxShadow: "menu",
            border: "1px solid var(--border)",
            borderRadius: "default",
            p: 1,
            width: 160,
          }}
        >
          {/* <ColorPicker
            colors={DEFAULT_COLORS}
            color={color}
            onClear={() => onColorChange()}
            onChange={(color) => onColorChange(color)}
          /> */}
        </Flex>
      </MenuPresenter>
    </>
  );
}
