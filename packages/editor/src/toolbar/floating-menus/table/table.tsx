import { useEffect, useState } from "react";
import { Flex } from "rebass";
// import { ColorPicker, DEFAULT_COLORS } from "../tools/colors";
import { FloatingMenuProps } from "../types";
import { useToolbarLocation } from "../../stores/toolbar-store";
import { PositionOptions } from "../../../utils/position";
import { PopupPresenter } from "../../../components/popup-presenter";
import { getToolbarElement } from "../../utils/dom";
import {
  ColumnProperties,
  InsertColumnRight,
  InsertRowBelow,
  RowProperties,
  TableProperties,
} from "../../tools/table";
import { getToolDefinition } from "../../tool-definitions";

export function TableRowFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  // const theme = editor.storage.theme as Theme;
  const [position, setPosition] = useState<PositionOptions | null>(null);

  useEffect(() => {
    if (
      !editor.isActive("tableCell") &&
      !editor.isActive("tableRow") &&
      !editor.isActive("tableHeader")
    ) {
      setPosition(null);
      return;
    }

    let { $from } = editor.state.selection;

    const selectedNode = $from.node();
    const pos = selectedNode.isTextblock ? $from.before() : $from.pos;

    const currentRow = (editor.view.nodeDOM(pos) as HTMLElement)?.closest("tr");
    if (!currentRow) return;
    setPosition((old) => {
      if (old?.target === currentRow) return old;

      return {
        isTargetAbsolute: true,
        location: "left",
        xOffset: -5,
        target: currentRow,
        // parent: editor.view.dom as HTMLElement,
      };
    });
  }, [editor.state.selection]);

  if (!position) return null;

  return (
    <PopupPresenter
      isOpen
      blocking={false}
      focusOnRender={false}
      onClose={() => {}}
      position={position}
    >
      <Flex
        sx={{
          bg: "background",
          flexWrap: "nowrap",
          borderRadius: "default",
          // opacity: isMenuOpen ? 1 : 0.3,
          ":hover": {
            opacity: 1,
          },
        }}
      >
        <RowProperties
          {...getToolDefinition("rowProperties")}
          icon="more"
          variant="small"
          editor={editor}
        />
        <InsertRowBelow
          {...getToolDefinition("insertRowBelow")}
          editor={editor}
          variant="small"
        />
      </Flex>
    </PopupPresenter>
  );
}

export function TableColumnFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const [position, setPosition] = useState<PositionOptions | null>(null);

  useEffect(() => {
    if (
      !editor.isActive("tableCell") &&
      !editor.isActive("tableRow") &&
      !editor.isActive("tableHeader")
    ) {
      setPosition(null);
      return;
    }
    let { $from } = editor.state.selection;

    const selectedNode = $from.node();
    const pos = selectedNode.isTextblock ? $from.before() : $from.pos;

    const currentCell = (editor.view.nodeDOM(pos) as HTMLElement)?.closest(
      "td,th"
    );
    const currentTable = currentCell?.closest("table");

    if (!currentCell || !currentTable) return;

    setPosition((old) => {
      if (old?.target === currentCell) return old;

      return {
        isTargetAbsolute: true,
        location: "top",
        align: "center",
        yAnchor: currentTable,
        yOffset: 2,
        target: currentCell as HTMLElement,
      };
    });
  }, [editor.state.selection]);

  if (!position) return null;

  return (
    <PopupPresenter
      isOpen
      onClose={() => {}}
      blocking={false}
      position={position}
      focusOnRender={false}
    >
      <Flex
        sx={{
          bg: "background",
          flexWrap: "nowrap",
          borderRadius: "default",
          // opacity: 0.3,
          //  opacity: isMenuOpen || showCellProps ? 1 : 0.3,
          ":hover": {
            opacity: 1,
          },
        }}
      >
        <TableProperties
          editor={editor}
          title="tableProperties"
          icon="more"
          variant={"small"}
        />
        <InsertColumnRight
          {...getToolDefinition("insertColumnRight")}
          editor={editor}
          variant={"small"}
          icon="plus"
        />
      </Flex>
    </PopupPresenter>
  );
}

export function TableFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const toolbarLocation = useToolbarLocation();
  if (!editor.isActive("table")) return null;
  return (
    <PopupPresenter
      isOpen
      onClose={() => {}}
      blocking={false}
      position={{
        isTargetAbsolute: true,
        target: getToolbarElement(),
        location: toolbarLocation === "bottom" ? "top" : "below",
      }}
      focusOnRender={false}
    >
      <Flex
        sx={{
          bg: "background",
          flexWrap: "nowrap",
          borderRadius: "default",
          // opacity: 0.3,
          //  opacity: isMenuOpen || showCellProps ? 1 : 0.3,
          ":hover": {
            opacity: 1,
          },
        }}
      >
        {/* <RowProperties
          title="Row properties"
          editor={editor}
          variant="normal"
          icon="rowProperties"
        />
        <InsertRowBelow
          title="Insert row below"
          icon="insertRowBelow"
          editor={editor}
          variant="normal"
        />
        <ColumnProperties
          title="Column properties"
          editor={editor}
          icon="columnProperties"
          variant={"normal"}
        />
        <InsertColumnRight
          editor={editor}
          title="Insert column right"
          variant={"normal"}
          icon="insertColumnRight"
        /> */}
      </Flex>
    </PopupPresenter>
  );
}
