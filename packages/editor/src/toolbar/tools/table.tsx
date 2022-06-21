import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { useCallback, useMemo, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { ResponsivePresenter } from "../../components/responsive";
import { MenuButton, MenuItem } from "../../components/menu/types";
import {
  moveColumnLeft as moveColumnLeftAction,
  moveColumnRight as moveColumnRightAction,
  moveRowDown as moveRowDownAction,
  moveRowUp as moveRowUpAction,
} from "../../extensions/table/actions";
import { MoreTools } from "../components/more-tools";
import { menuButtonToTool } from "./utils";
import { getToolDefinition } from "../tool-definitions";
import { CellProperties as CellPropertiesPopup } from "../popups/cell-properties";
import { ColorTool } from "./colors";
import { Counter } from "../components/counter";
import { useToolbarLocation } from "../stores/toolbar-store";
import { showPopup } from "../../components/popup-presenter";

export function TableSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("table") || !isBottom) return null;
  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="tableSettings"
      tools={[
        "insertColumnLeft",
        "insertColumnRight",
        "insertRowAbove",
        "insertRowBelow",
        "cellProperties",
        "columnProperties",
        "rowProperties",
        "deleteRow",
        "deleteColumn",
        "deleteTable",
      ]}
    />
  );
}

export function RowProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = useMemo(
    () => [
      insertRowAbove(editor),
      insertRowBelow(editor),
      moveRowUp(editor),
      moveRowDown(editor),
      deleteRow(editor),
    ],
    []
  );

  return (
    <>
      <ToolButton
        {...props}
        buttonRef={buttonRef}
        toggled={isMenuOpen}
        onClick={() => setIsMenuOpen(true)}
      />
      <ResponsivePresenter
        title="Row properties"
        mobile="sheet"
        desktop="menu"
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position={{
          target: buttonRef.current,
          isTargetAbsolute: true,
          location: "below",
          yOffset: 5,
        }}
        items={items}
      />
    </>
  );
}

export function ColumnProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const items = useMemo(
    () => [
      insertColumnLeft(editor),
      insertColumnRight(editor),
      moveColumnLeft(editor),
      moveColumnRight(editor),
      deleteColumn(editor),
    ],
    []
  );

  return (
    <>
      <ToolButton
        {...props}
        buttonRef={buttonRef}
        toggled={isMenuOpen}
        onClick={() => setIsMenuOpen(true)}
      />
      <ResponsivePresenter
        title="Column properties"
        mobile="sheet"
        desktop="menu"
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position={{
          target: buttonRef.current,
          isTargetAbsolute: true,
          location: "below",
          yOffset: 5,
        }}
        items={items}
      />
    </>
  );
}

export function TableProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const items = useMemo<MenuItem[]>(
    () => [
      insertColumnLeft(editor),
      insertColumnRight(editor),
      moveColumnLeft(editor),
      moveColumnRight(editor),
      deleteColumn(editor),
      { type: "separator", key: "cellSeperator" },
      mergeCells(editor),
      splitCells(editor),
      cellProperties(editor),
      { type: "separator", key: "tableSeperator" },
      deleteTable(editor),
    ],
    []
  );

  return (
    <>
      <ToolButton
        {...props}
        buttonRef={buttonRef}
        toggled={isMenuOpen}
        onClick={() => setIsMenuOpen(true)}
      />
      <ResponsivePresenter
        title="Table properties"
        mobile="sheet"
        desktop="menu"
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position={{
          target: buttonRef.current,
          isTargetAbsolute: true,
          location: "below",
          yOffset: 5,
        }}
        items={items}
      />
    </>
  );
}

export function CellProperties(props: ToolProps) {
  return (
    <>
      <MoreTools
        {...props}
        popupId="cellProperties"
        tools={[
          "mergeCells",
          "splitCells",
          "cellBackgroundColor",
          "cellTextColor",
          "cellBorderColor",
          "cellBorderWidth",
        ]}
      />
    </>
  );
}

export function CellBackgroundColor(props: ToolProps) {
  return (
    <ColorTool
      {...props}
      cacheKey="cellBackgroundColor"
      getActiveColor={(editor) =>
        editor.getAttributes("tableCell").backgroundColor
      }
      title={"Cell background color"}
      onColorChange={(editor, color) =>
        editor.chain().setCellAttribute("backgroundColor", color).run()
      }
    />
  );
}

export function CellTextColor(props: ToolProps) {
  return (
    <ColorTool
      {...props}
      cacheKey="cellTextColor"
      getActiveColor={(editor) => editor.getAttributes("tableCell").color}
      title={"Cell text color"}
      onColorChange={(editor, color) =>
        editor.chain().focus().setCellAttribute("color", color).run()
      }
    />
  );
}

export function CellBorderColor(props: ToolProps) {
  return (
    <ColorTool
      {...props}
      cacheKey="cellBorderColor"
      getActiveColor={(editor) => editor.getAttributes("tableCell").borderColor}
      title={"Cell border color"}
      onColorChange={(editor, color) =>
        editor.chain().focus().setCellAttribute("borderColor", color).run()
      }
    />
  );
}

export function CellBorderWidth(props: ToolProps) {
  const { editor } = props;
  const { borderWidth: _borderWidth } = editor.getAttributes("tableCell");
  const borderWidth: number = _borderWidth ? _borderWidth : 1;

  const decreaseBorderWidth = useCallback(() => {
    return Math.max(1, borderWidth - 1);
  }, [borderWidth]);

  const increaseBorderWidth = useCallback(() => {
    return Math.min(10, borderWidth + 1);
  }, [borderWidth]);

  return (
    <Flex sx={{ justifyContent: "center", alignItems: "center" }}>
      <Text variant={"subBody"} sx={{ mx: 1 }}>
        Border width:
      </Text>
      <Counter
        title="cell border width"
        onDecrease={() =>
          editor.commands.setCellAttribute("borderWidth", decreaseBorderWidth())
        }
        onIncrease={() =>
          editor.commands.setCellAttribute("borderWidth", increaseBorderWidth())
        }
        onReset={() => editor.commands.setCellAttribute("borderWidth", 1)}
        value={borderWidth + "px"}
      />
    </Flex>
  );
}

const insertColumnLeft = (editor: Editor): MenuButton => ({
  ...getToolDefinition("insertColumnLeft"),
  key: "addColumnLeft",
  type: "button",
  onClick: () => editor.chain().focus().addColumnBefore().run(),
});

const insertColumnRight = (editor: Editor): MenuButton => ({
  ...getToolDefinition("insertColumnRight"),
  key: "addColumnRight",
  type: "button",
  title: "Add column right",
  onClick: () => editor.chain().focus().addColumnAfter().run(),
  icon: "insertColumnRight",
});

const moveColumnLeft = (editor: Editor): MenuButton => ({
  ...getToolDefinition("moveColumnLeft"),
  key: "moveColumnLeft",
  type: "button",
  onClick: () => moveColumnLeftAction(editor),
});

const moveColumnRight = (editor: Editor): MenuButton => ({
  ...getToolDefinition("moveColumnRight"),
  key: "moveColumnRight",
  type: "button",
  onClick: () => moveColumnRightAction(editor),
});

const deleteColumn = (editor: Editor): MenuButton => ({
  ...getToolDefinition("deleteColumn"),
  key: "deleteColumn",
  type: "button",
  onClick: () => editor.chain().focus().deleteColumn().run(),
});

const splitCells = (editor: Editor): MenuButton => ({
  ...getToolDefinition("splitCells"),
  key: "splitCells",
  type: "button",
  onClick: () => editor.chain().focus().splitCell().run(),
});

const mergeCells = (editor: Editor): MenuButton => ({
  ...getToolDefinition("mergeCells"),
  key: "mergeCells",
  type: "button",
  onClick: () => editor.chain().focus().mergeCells().run(),
});

const insertRowAbove = (editor: Editor): MenuButton => ({
  ...getToolDefinition("insertRowAbove"),
  key: "insertRowAbove",
  type: "button",
  onClick: () => editor.chain().focus().addRowBefore().run(),
});

const insertRowBelow = (editor: Editor): MenuButton => ({
  ...getToolDefinition("insertRowBelow"),
  key: "insertRowBelow",
  type: "button",
  onClick: () => editor.chain().focus().addRowAfter().run(),
});

const moveRowUp = (editor: Editor): MenuButton => ({
  ...getToolDefinition("moveRowUp"),
  key: "moveRowUp",
  type: "button",
  onClick: () => moveRowUpAction(editor),
});
const moveRowDown = (editor: Editor): MenuButton => ({
  ...getToolDefinition("moveRowDown"),
  key: "moveRowDown",
  type: "button",
  onClick: () => moveRowDownAction(editor),
});

const deleteRow = (editor: Editor): MenuButton => ({
  ...getToolDefinition("deleteRow"),
  key: "deleteRow",
  type: "button",
  onClick: () => editor.chain().focus().deleteRow().run(),
});

const deleteTable = (editor: Editor): MenuButton => ({
  ...getToolDefinition("deleteTable"),
  key: "deleteTable",
  type: "button",
  onClick: () => editor.chain().focus().deleteTable().run(),
});

const cellProperties = (editor: Editor): MenuButton => ({
  ...getToolDefinition("cellProperties"),
  key: "cellProperties",
  type: "button",
  onClick: () => {
    showPopup({
      theme: editor.storage.theme,
      popup: (hide) => <CellPropertiesPopup onClose={hide} editor={editor} />,
    });
  },
});

export const InsertColumnLeft = menuButtonToTool(insertColumnLeft);
export const InsertColumnRight = menuButtonToTool(insertColumnRight);
export const MoveColumnLeft = menuButtonToTool(moveColumnLeft);
export const MoveColumnRight = menuButtonToTool(moveColumnRight);
export const DeleteColumn = menuButtonToTool(deleteColumn);
export const SplitCells = menuButtonToTool(splitCells);
export const MergeCells = menuButtonToTool(mergeCells);
export const InsertRowAbove = menuButtonToTool(insertRowAbove);
export const InsertRowBelow = menuButtonToTool(insertRowBelow);
export const MoveRowUp = menuButtonToTool(moveRowUp);
export const MoveRowDown = menuButtonToTool(moveRowDown);
export const DeleteRow = menuButtonToTool(deleteRow);
export const DeleteTable = menuButtonToTool(deleteTable);
