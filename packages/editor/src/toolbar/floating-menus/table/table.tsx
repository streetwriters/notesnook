import { useEffect, useState } from "react";
import { Flex } from "rebass";
import { MenuPresenter } from "../../../components/menu/menu";
import { MenuOptions } from "../../../components/menu/useMenu";
// import { ColorPicker, DEFAULT_COLORS } from "../tools/colors";
import { FloatingMenuProps } from "../types";
import {
  ColumnProperties,
  InsertColumnRight,
  InsertRowBelow,
  RowProperties,
} from "./tools";
import { getToolbarElement } from "../../utils/dom";
import { useToolbarContext } from "../../hooks/useToolbarContext";
import { useToolbarLocation } from "../../stores/toolbar-store";

export function TableRowFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  // const theme = editor.storage.theme as Theme;
  const [position, setPosition] = useState<MenuOptions["position"] | null>(
    null
  );

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
    <MenuPresenter
      isOpen
      items={[]}
      onClose={() => {}}
      options={{
        type: "autocomplete",
        position,
      }}
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
          title="Row properties"
          editor={editor}
          variant="small"
          icon="more"
        />
        <InsertRowBelow
          title="Insert row below"
          icon="insertRowBelow"
          editor={editor}
          variant="small"
        />
      </Flex>
    </MenuPresenter>
  );
}

export function TableColumnFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const [position, setPosition] = useState<MenuOptions["position"] | null>(
    null
  );

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
    <MenuPresenter
      isOpen
      items={[]}
      onClose={() => {}}
      options={{
        type: "autocomplete",
        position,
      }}
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
        <ColumnProperties
          currentCell={position.target as HTMLElement}
          title="Column properties"
          editor={editor}
          icon="more"
          variant={"small"}
        />
        <InsertColumnRight
          editor={editor}
          title="Insert column right"
          variant={"small"}
          icon="plus"
        />
      </Flex>
    </MenuPresenter>
  );
}

export function TableFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const toolbarLocation = useToolbarLocation();
  if (!editor.isActive("table")) return null;
  return (
    <MenuPresenter
      isOpen
      items={[]}
      onClose={() => {}}
      options={{
        type: "autocomplete",
        position: {
          isTargetAbsolute: true,
          target: getToolbarElement(),
          location: toolbarLocation === "bottom" ? "top" : "below",
        },
      }}
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
        <RowProperties
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
        />
      </Flex>
    </MenuPresenter>
  );
}
