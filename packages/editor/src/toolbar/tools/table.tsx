/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { ToolProps } from "../types";
import { Editor } from "../../types";
import { ToolButton } from "../components/tool-button";
import { useCallback, useMemo, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { MenuButton, MenuItem } from "../../components/menu/types";
import {
  moveColumnLeft as moveColumnLeftAction,
  moveColumnRight as moveColumnRightAction,
  moveRowDown as moveRowDownAction,
  moveRowUp as moveRowUpAction,
  exportToCSV as exportToCSVAction
} from "../../extensions/table/actions";
import { MoreTools } from "../components/more-tools";
import { menuButtonToTool } from "./utils";
import { getToolDefinition } from "../tool-definitions";
import { CellProperties as CellPropertiesPopup } from "../popups/cell-properties";
import { ColorTool } from "./colors";
import { Counter } from "../components/counter";
import { useToolbarLocation } from "../stores/toolbar-store";
import { showPopup } from "../../components/popup-presenter";
import { useRefValue } from "../../hooks/use-ref-value";

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
        "columnProperties",
        "rowProperties",
        "deleteRow",
        "deleteColumn",
        "deleteTable"
      ]}
    />
  );
}

export function RowProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = useMemo(
    () => [
      insertRowAbove(editor),
      insertRowBelow(editor),
      moveRowUp(editor),
      moveRowDown(editor),
      deleteRow(editor)
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          yOffset: 5
        }}
        items={items}
      />
    </>
  );
}

export function ColumnProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const items = useMemo(
    () => [
      insertColumnLeft(editor),
      insertColumnRight(editor),
      moveColumnLeft(editor),
      moveColumnRight(editor),
      deleteColumn(editor)
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          yOffset: 5
        }}
        items={items}
      />
    </>
  );
}

export function TableProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
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
      exportToCSV(editor),
      deleteTable(editor)
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          yOffset: -25
        }}
        items={items}
      />
    </>
  );
}

export function CellProperties(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("table") || !isBottom) return null;

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
          "cellBorderWidth"
        ]}
      />
    </>
  );
}

export function CellBackgroundColor(props: ToolProps) {
  const { editor } = props;

  return (
    <ColorTool
      {...props}
      cacheKey="cellBackgroundColor"
      activeColor={editor.current?.getAttributes("tableCell").backgroundColor}
      title={"Cell background color"}
      onColorChange={(color) =>
        editor.current?.chain().setCellAttribute("backgroundColor", color).run()
      }
    />
  );
}

export function CellTextColor(props: ToolProps) {
  const { editor } = props;

  return (
    <ColorTool
      {...props}
      cacheKey="cellTextColor"
      activeColor={editor.current?.getAttributes("tableCell").color}
      title={"Cell text color"}
      onColorChange={(color) =>
        editor.current?.chain().focus().setCellAttribute("color", color).run()
      }
    />
  );
}

export function CellBorderColor(props: ToolProps) {
  const { editor } = props;

  return (
    <ColorTool
      {...props}
      cacheKey="cellBorderColor"
      activeColor={editor.current?.getAttributes("tableCell").borderColor}
      title={"Cell border color"}
      onColorChange={(color) =>
        editor.current
          ?.chain()
          .focus()
          .setCellAttribute("borderColor", color)
          .run()
      }
    />
  );
}

export function CellBorderWidth(props: ToolProps) {
  const { editor } = props;
  const { borderWidth: _borderWidth } = editor.getAttributes("tableCell");
  const borderWidth: number = _borderWidth
    ? typeof _borderWidth === "string"
      ? parseInt(_borderWidth)
      : _borderWidth
    : 1;
  const borderWidthAsNumber = useRefValue(borderWidth);

  const decreaseBorderWidth = useCallback(() => {
    return Math.max(1, borderWidthAsNumber.current - 1);
  }, [borderWidthAsNumber]);

  const increaseBorderWidth = useCallback(() => {
    return Math.min(10, borderWidthAsNumber.current + 1);
  }, [borderWidthAsNumber]);

  return (
    <Counter
      title="cell border width"
      onDecrease={() =>
        editor.current?.commands.setCellAttribute(
          "borderWidth",
          decreaseBorderWidth()
        )
      }
      onIncrease={() =>
        editor.current?.commands.setCellAttribute(
          "borderWidth",
          increaseBorderWidth()
        )
      }
      onReset={() =>
        editor.current?.commands.setCellAttribute("borderWidth", 1)
      }
      value={borderWidth + "px"}
    />
  );
}

const insertColumnLeft = (editor: Editor): MenuButton => ({
  ...getToolDefinition("insertColumnLeft"),
  key: "addColumnLeft",
  type: "button",
  onClick: () => editor.current?.chain().focus().addColumnBefore().run()
});

const insertColumnRight = (editor: Editor): MenuButton => ({
  ...getToolDefinition("insertColumnRight"),
  key: "addColumnRight",
  type: "button",
  title: "Add column right",
  onClick: () => editor.current?.chain().focus().addColumnAfter().run(),
  icon: "insertColumnRight"
});

const moveColumnLeft = (editor: Editor): MenuButton => ({
  ...getToolDefinition("moveColumnLeft"),
  key: "moveColumnLeft",
  type: "button",
  onClick: () => moveColumnLeftAction(editor.current)
});

const moveColumnRight = (editor: Editor): MenuButton => ({
  ...getToolDefinition("moveColumnRight"),
  key: "moveColumnRight",
  type: "button",
  onClick: () => moveColumnRightAction(editor.current)
});

const deleteColumn = (editor: Editor): MenuButton => ({
  ...getToolDefinition("deleteColumn"),
  key: "deleteColumn",
  type: "button",
  onClick: () => editor.current?.chain().focus().deleteColumn().run()
});

const splitCells = (editor: Editor): MenuButton => ({
  ...getToolDefinition("splitCells"),
  key: "splitCells",
  type: "button",
  onClick: () => editor.current?.chain().focus().splitCell().run()
});

const mergeCells = (editor: Editor): MenuButton => ({
  ...getToolDefinition("mergeCells"),
  key: "mergeCells",
  type: "button",
  onClick: () => editor.current?.chain().focus().mergeCells().run()
});

const insertRowAbove = (editor: Editor): MenuButton => ({
  ...getToolDefinition("insertRowAbove"),
  key: "insertRowAbove",
  type: "button",
  onClick: () => editor.current?.chain().focus().addRowBefore().run()
});

const insertRowBelow = (editor: Editor): MenuButton => ({
  ...getToolDefinition("insertRowBelow"),
  key: "insertRowBelow",
  type: "button",
  onClick: () => editor.current?.chain().focus().addRowAfter().run()
});

const moveRowUp = (editor: Editor): MenuButton => ({
  ...getToolDefinition("moveRowUp"),
  key: "moveRowUp",
  type: "button",
  onClick: () => moveRowUpAction(editor.current)
});
const moveRowDown = (editor: Editor): MenuButton => ({
  ...getToolDefinition("moveRowDown"),
  key: "moveRowDown",
  type: "button",
  onClick: () => moveRowDownAction(editor.current)
});

const deleteRow = (editor: Editor): MenuButton => ({
  ...getToolDefinition("deleteRow"),
  key: "deleteRow",
  type: "button",
  onClick: () => editor.current?.chain().focus().deleteRow().run()
});

const deleteTable = (editor: Editor): MenuButton => ({
  ...getToolDefinition("deleteTable"),
  key: "deleteTable",
  type: "button",
  onClick: () => editor.current?.chain().focus().deleteTable().run()
});

const exportToCSV = (editor: Editor): MenuButton => ({
  ...getToolDefinition("exportToCSV"),
  key: "exportToCSV",
  type: "button",
  onClick: () => exportToCSVAction(editor.requestPermission("exportToCSV"))
});

const cellProperties = (editor: Editor): MenuButton => ({
  ...getToolDefinition("cellProperties"),
  key: "cellProperties",
  type: "button",
  onClick: () => {
    showPopup({
      popup: (hide) => <CellPropertiesPopup onClose={hide} editor={editor} />
    });
  }
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
export const ExportToCSV = menuButtonToTool(exportToCSV);
