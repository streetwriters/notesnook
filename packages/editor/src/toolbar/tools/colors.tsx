import { Editor } from "@tiptap/core";
import { useState } from "react";
import tinycolor from "tinycolor2";
import { PopupWrapper } from "../../components/popup-presenter";
import { useEditorContext } from "../../components/popup-presenter/popuprenderer";
import { SplitButton } from "../components/split-button";
import { ColorPicker } from "../popups/color-picker";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ToolProps } from "../types";
import { getToolbarElement } from "../utils/dom";

type ColorToolProps = ToolProps & {
  onColorChange: (editor: Editor, color?: string) => void;
  isActive: (editor: Editor) => boolean;
  getActiveColor: (editor: Editor) => string;
  title: string;
};
export function ColorTool(props: ColorToolProps) {
  const { onColorChange, isActive, getActiveColor, title, ...toolProps } =
    props;
  const editor = useEditorContext();
  const activeColor = getActiveColor(editor);
  const _isActive = isActive(editor);
  const tColor = tinycolor(activeColor);
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // const { hide, isOpen, show } = usePopup({
  //   id: title,
  //   group: "color",
  //   theme: editor?.storage.theme,
  //   blocking: false,
  //   focusOnRender: false,
  // });
  // console.log("Updating color", editor);

  return (
    <SplitButton
      {...toolProps}
      iconColor={_isActive && tColor.isDark() ? "static" : "icon"}
      sx={{
        mr: 0,
        bg: _isActive ? activeColor : "transparent",
        ":hover": {
          bg:
            _isActive && !isBottom
              ? tColor.darken(5).toRgbString()
              : "transparent",
        },
      }}
      onOpen={() => {
        setIsOpen((s) => !s);
      }}
      toggled={isOpen}
    >
      <PopupWrapper
        isOpen={isOpen}
        id={title}
        group={"color"}
        position={{
          isTargetAbsolute: true,
          target: getToolbarElement(),
          align: isBottom ? "center" : "end",
          location: isBottom ? "top" : "below",
          yOffset: 10,
        }}
        focusOnRender={false}
        blocking={false}
        renderPopup={(close) => (
          <ColorPicker
            color={activeColor}
            onClear={() => onColorChange(editor)}
            onChange={(color) => onColorChange(editor, color)}
            onClose={close}
            title={title}
          />
        )}
      />
    </SplitButton>
  );
}

export function Highlight(props: ToolProps) {
  return (
    <ColorTool
      {...props}
      isActive={(editor) => editor.isActive("highlight", { color: /\W+/gm })}
      getActiveColor={(editor) => editor.getAttributes("highlight").color}
      title={"Background color"}
      onColorChange={(editor, color) =>
        color
          ? editor.chain().focus().toggleHighlight({ color }).run()
          : editor.chain().focus().unsetHighlight().run()
      }
    />
  );
}

export function TextColor(props: ToolProps) {
  return (
    <ColorTool
      {...props}
      isActive={(editor) => editor.isActive("textStyle", { color: /\W+/gm })}
      getActiveColor={(editor) => editor.getAttributes("textStyle").color}
      title="Text color"
      onColorChange={(editor, color) =>
        color
          ? editor.chain().focus().setColor(color).run()
          : editor.chain().focus().unsetColor().run()
      }
    />
  );
}
