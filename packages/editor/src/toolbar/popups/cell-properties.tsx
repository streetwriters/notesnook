import { Editor } from "../../types";
import { Box } from "rebass";
import { Tab, Tabs } from "../../components/tabs";
import { Icon } from "../components/icon";
// import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { Icons } from "../icons";
import { ColorPicker } from "./color-picker";

type CellPropertiesProps = { editor: Editor; onClose: () => void };
export function CellProperties(props: CellPropertiesProps) {
  const { editor, onClose } = props;
  const attributes = editor.getAttributes("tableCell");
  return (
    <Popup title="Cell properties" onClose={onClose}>
      <Tabs activeIndex={0}>
        <Tab
          title={
            <Icon
              title="Cell background color"
              path={Icons.backgroundColor}
              size={16}
            />
          }
        >
          <Box mt={2} />
          <ColorPicker
            expanded={true}
            color={attributes.backgroundColor}
            onChange={(color) =>
              editor.current?.commands.setCellAttribute(
                "backgroundColor",
                color
              )
            }
            onClear={() =>
              editor.current?.commands.setCellAttribute(
                "backgroundColor",
                undefined
              )
            }
          />
        </Tab>
        <Tab
          title={
            <Icon title="Cell text color" path={Icons.textColor} size={16} />
          }
        >
          <Box mt={2} />
          <ColorPicker
            expanded={true}
            color={attributes.color}
            onChange={(color) =>
              editor.current?.commands.setCellAttribute("color", color)
            }
            onClear={() =>
              editor.current?.commands.setCellAttribute("color", undefined)
            }
          />
        </Tab>
        <Tab
          title={
            <Icon
              title="Cell border color"
              path={Icons.cellBorderColor}
              size={16}
            />
          }
        >
          <Box mt={2} />
          <ColorPicker
            expanded={true}
            color={attributes.borderColor}
            onChange={(color) =>
              editor.current?.commands.setCellAttribute("borderColor", color)
            }
            onClear={() =>
              editor.current?.commands.setCellAttribute(
                "borderColor",
                undefined
              )
            }
          />
        </Tab>
      </Tabs>
    </Popup>
  );
}
