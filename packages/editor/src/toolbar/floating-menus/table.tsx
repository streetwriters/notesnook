import { Theme } from "@notesnook/theme";
import { Slider } from "@rebass/forms";
import { Editor, findParentNodeClosestToPos } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { MenuPresenter } from "../../components/menu/menu";
import { getElementPosition, MenuOptions } from "../../components/menu/useMenu";
import { Popup } from "../components/popup";
import { ToolButton } from "../components/tool-button";
import { IconNames } from "../icons";
// import { ColorPicker, DEFAULT_COLORS } from "../tools/colors";
import { FloatingMenuProps } from "./types";
import { selectedRect, TableMap, TableRect } from "prosemirror-tables";
import { Transaction } from "prosemirror-state";
import { MenuItem } from "../../components/menu/types";

export function TableRowFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const theme = editor.storage.theme as Theme;
  const [position, setPosition] = useState<MenuOptions["position"] | null>(
    null
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          opacity: isMenuOpen ? 1 : 0.3,
          ":hover": {
            opacity: 1,
          },
        }}
      >
        <ToolButton
          toggled={isMenuOpen}
          title="Row properties"
          id="properties"
          icon="more"
          onClick={() => setIsMenuOpen(true)}
          iconSize={16}
          sx={{ mr: 0, p: "3px", borderRadius: "small" }}
        />
        <ToolButton
          toggled={false}
          title="Insert row below"
          id="insertRowBelow"
          icon="insertRowBelow"
          onClick={() => editor.chain().focus().addRowAfter().run()}
          sx={{ mr: 0, p: "3px", borderRadius: "small" }}
          iconSize={16}
        />
      </Flex>

      <MenuPresenter
        isOpen={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
          editor.commands.focus();
        }}
        options={{
          type: "menu",
          position: {},
        }}
        items={[
          {
            key: "addRowAbove",
            type: "menuitem",
            title: "Add row above",
            onClick: () => editor.chain().focus().addRowBefore().run(),
            icon: "insertRowAbove",
          },
          {
            key: "moveRowUp",
            type: "menuitem",
            title: "Move row up",
            onClick: () => moveRowUp(editor),
            icon: "moveRowUp",
          },
          {
            key: "moveRowDown",
            type: "menuitem",
            title: "Move row down",
            onClick: () => moveRowDown(editor),
            icon: "moveRowDown",
          },
          {
            key: "deleteRow",
            type: "menuitem",
            title: "Delete row",
            onClick: () => editor.chain().focus().deleteRow().run(),
            icon: "deleteRow",
          },
        ]}
      />
    </MenuPresenter>
  );
}

export function TableColumnFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const [position, setPosition] = useState<MenuOptions["position"] | null>(
    null
  );
  const isInsideCellSelection =
    !editor.state.selection.empty &&
    editor.state.selection.$anchor.node().type.name === "tableCell";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCellProps, setShowCellProps] = useState(false);
  const [menuPosition, setMenuPosition] = useState<
    MenuOptions["position"] | null
  >(null);

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
        yOffset: -2,
        target: currentCell as HTMLElement,
      };
    });
  }, [editor.state.selection]);

  if (!position) return null;

  const columnProperties: MenuItem[] = [
    {
      key: "addColumnLeft",
      type: "menuitem",
      title: "Add column left",
      onClick: () => editor.chain().focus().addColumnBefore().run(),
      icon: "insertColumnLeft",
    },
    {
      key: "addColumnRight",
      type: "menuitem",
      title: "Add column right",
      onClick: () => editor.chain().focus().addColumnAfter().run(),
      icon: "insertColumnRight",
    },
    {
      key: "moveColumnLeft",
      type: "menuitem",
      title: "Move column left",
      onClick: () => moveColumnLeft(editor),
      icon: "moveColumnLeft",
    },
    {
      key: "moveColumnRight",
      type: "menuitem",
      title: "Move column right",
      onClick: () => moveColumnRight(editor),
      icon: "moveColumnRight",
    },
    {
      key: "deleteColumn",
      type: "menuitem",
      title: "Delete column",
      onClick: () => editor.chain().focus().deleteColumn().run(),
      icon: "deleteColumn",
    },
  ];

  const mergeSplitProperties: MenuItem[] = [
    {
      key: "splitCells",
      type: "menuitem",
      title: "Split cells",
      onClick: () => editor.chain().focus().splitCell().run(),
      icon: "splitCells",
    },
    {
      key: "mergeCells",
      type: "menuitem",
      title: "Merge cells",
      onClick: () => editor.chain().focus().mergeCells().run(),
      icon: "mergeCells",
    },
  ];

  const cellProperties: MenuItem[] = [
    {
      key: "cellProperties",
      type: "menuitem",
      title: "Cell properties",
      onClick: () => {
        setShowCellProps(true);
        setMenuPosition({
          target: position.target || undefined,
          isTargetAbsolute: true,
          yOffset: 10,
          location: "below",
        });
      },
      icon: "cellProperties",
    },
  ];

  const tableProperties: MenuItem[] = [
    {
      key: "deleteTable",
      type: "menuitem",
      title: "Delete table",
      icon: "deleteTable",
      onClick: () => editor.chain().focus().deleteTable().run(),
    },
  ];

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
          opacity: isMenuOpen || showCellProps ? 1 : 0.3,
          ":hover": {
            opacity: 1,
          },
        }}
      >
        <ToolButton
          toggled={isMenuOpen}
          title="Column properties"
          id="properties"
          icon="more"
          onClick={async () => setIsMenuOpen(true)}
          iconSize={16}
          sx={{ mr: 0, p: "3px", borderRadius: "small" }}
        />
        <ToolButton
          toggled={false}
          title="Insert column right"
          id="insertColumnRight"
          icon="plus"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          sx={{ mr: 0, p: "3px", borderRadius: "small" }}
          iconSize={16}
        />
      </Flex>

      <MenuPresenter
        isOpen={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
          editor.commands.focus();
        }}
        options={{
          type: "menu",
          position: {},
        }}
        items={
          isInsideCellSelection
            ? [...mergeSplitProperties, ...cellProperties]
            : [
                ...columnProperties,
                { type: "seperator", key: "cellSeperator" },
                ...cellProperties,
                { type: "seperator", key: "tableSeperator" },
                ...tableProperties,
              ]
        }
      />

      <MenuPresenter
        isOpen={showCellProps}
        onClose={() => {
          setShowCellProps(false);
          editor.commands.focus();
        }}
        options={{
          type: "menu",
          position: menuPosition || {},
        }}
        items={[]}
      >
        <CellProperties
          editor={editor}
          onClose={() => setShowCellProps(false)}
        />
      </MenuPresenter>
    </MenuPresenter>
  );
}

type CellPropertiesProps = { editor: Editor; onClose: () => void };
function CellProperties(props: CellPropertiesProps) {
  const { editor, onClose } = props;
  const attributes = editor.getAttributes("tableCell");
  console.log(attributes);
  return (
    <Popup
      title="Cell properties"
      action={{
        icon: "close",
        iconColor: "error",
        onClick: onClose,
      }}
    >
      <Flex sx={{ flexDirection: "column", width: 200, px: 1, mb: 2 }}>
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
          iconSize={16}
          sx={{
            p: "2.5px",
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

/**
 * Done:
 * insertTable
 *
 * addRowBefore
 * addRowAfter
 * deleteRow
 *
 * addColumnBefore
 * addColumnAfter
 * deleteColumn
 *
 * setCellAttribute
 *
 * deleteTable
 *
 * mergeCells
 * splitCell
 * mergeOrSplit
 *
 * toggleHeaderColumn
 * toggleHeaderRow
 * toggleHeaderCell
 * fixTables
 * goToNextCell
 * goToPreviousCell
 */

function moveColumnRight(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.right === rect.map.width) return;

  const transaction = moveColumn(tr, rect, rect.left, rect.left + 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
}

function moveColumnLeft(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.left === 0) return;

  const transaction = moveColumn(tr, rect, rect.left, rect.left - 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
}

function moveRowDown(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.top + 1 === rect.map.height) return;

  const transaction = moveRow(tr, rect, rect.top, rect.top + 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
}

function moveRowUp(editor: Editor) {
  const { tr } = editor.state;
  const rect = selectedRect(editor.state);
  if (rect.top === 0) return;

  const transaction = moveRow(tr, rect, rect.top, rect.top - 1);
  if (!transaction) return;

  editor.view.dispatch(transaction);
}

function moveColumn(
  tr: Transaction<any>,
  rect: TableRect,
  from: number,
  to: number
) {
  let fromCells = getColumnCells(rect, from);
  let toCells = getColumnCells(rect, to);

  return moveCells(tr, rect, fromCells, toCells);
}

function getColumnCells({ map, table }: TableRect, col: number) {
  let cells = [];
  for (let row = 0; row < map.height; ) {
    let index = row * map.width + col;
    if (index >= map.map.length) break;

    let pos = map.map[index];

    let cell = table.nodeAt(pos);
    if (!cell) continue;
    cells.push({ cell, pos });

    row += cell.attrs.rowspan;
    console.log(cell.textContent);
  }

  return cells;
}

function moveRow(
  tr: Transaction<any>,
  rect: TableRect,
  from: number,
  to: number
) {
  let fromCells = getRowCells(rect, from);
  let toCells = getRowCells(rect, to);
  return moveCells(tr, rect, fromCells, toCells);
}

function getRowCells({ map, table }: TableRect, row: number) {
  let cells = [];
  for (let col = 0, index = row * map.width; col < map.width; col++, index++) {
    if (index >= map.map.length) break;

    let pos = map.map[index];
    let cell = table.nodeAt(pos);

    if (!cell) continue;
    cells.push({ cell, pos });

    col += cell.attrs.colspan - 1;
  }

  return cells;
}

function moveCells(
  tr: Transaction<any>,
  rect: TableRect,
  fromCells: any[],
  toCells: any[]
) {
  if (fromCells.length !== toCells.length) return;
  let mapStart = tr.mapping.maps.length;

  for (let i = 0; i < toCells.length; ++i) {
    const fromCell = fromCells[i];
    const toCell = toCells[i];

    let fromStart = tr.mapping
      .slice(mapStart)
      .map(rect.tableStart + fromCell.pos);
    let fromEnd = fromStart + fromCell.cell.nodeSize;
    const fromSlice = tr.doc.slice(fromStart, fromEnd);

    const toStart = tr.mapping
      .slice(mapStart)
      .map(rect.tableStart + toCell.pos);
    const toEnd = toStart + toCell.cell.nodeSize;
    const toSlice = tr.doc.slice(toStart, toEnd);

    tr.replace(toStart, toEnd, fromSlice);

    fromStart = tr.mapping.slice(mapStart).map(rect.tableStart + fromCell.pos);
    fromEnd = fromStart + fromCell.cell.nodeSize;
    tr.replace(fromStart, fromEnd, toSlice);
  }

  return tr;
}
