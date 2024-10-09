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

import { ToolProps } from "../types.js";
import { Editor } from "../../types.js";
import { ToolButton } from "../components/tool-button.js";
import { useCallback, useMemo, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { MenuButtonItem, MenuItem } from "@notesnook/ui";
import {
  moveColumnLeft as moveColumnLeftAction,
  moveColumnRight as moveColumnRightAction,
  moveRowDown as moveRowDownAction,
  moveRowUp as moveRowUpAction
} from "../../extensions/table/actions.js";
import { MoreTools } from "../components/more-tools.js";
import { menuButtonToTool, toolToMenuButton } from "./utils.js";
import { getToolDefinition } from "../tool-definitions.js";
import { CellProperties as CellPropertiesPopup } from "../popups/cell-properties.js";
import { ColorTool } from "./colors.js";
import { Counter } from "../components/counter.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { showPopup } from "../../components/popup-presenter/index.js";
import { useRefValue } from "../../hooks/use-ref-value.js";
import { strings } from "@notesnook/intl";

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
        title={strings.rowProperties()}
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
        title={strings.columnProperties()}
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
        title={strings.tableSettings()}
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
      activeColor={editor.getAttributes("tableCell").backgroundColor}
      title={strings.cellBackgroundColor()}
      type="background"
      onColorChange={(color) =>
        editor.chain().setCellAttribute("backgroundColor", color).run()
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
      type="text"
      activeColor={editor.getAttributes("tableCell").color}
      title={strings.cellTextColor()}
      onColorChange={(color) =>
        editor.chain().focus().setCellAttribute("color", color).run()
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
      activeColor={editor.getAttributes("tableCell").borderColor}
      type="border"
      title={strings.cellBorderColor()}
      onColorChange={(color) =>
        editor.chain().focus().setCellAttribute("borderColor", color).run()
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
      title={strings.cellBorderWidth()}
      onDecrease={() =>
        editor.commands.setCellAttribute("borderWidth", decreaseBorderWidth())
      }
      onIncrease={() =>
        editor.commands.setCellAttribute("borderWidth", increaseBorderWidth())
      }
      onReset={() => editor.commands.setCellAttribute("borderWidth", 1)}
      value={borderWidth + "px"}
    />
  );
}

const insertColumnLeft = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("insertColumnLeft")),
  onClick: () => editor.chain().focus().addColumnBefore().run()
});

const insertColumnRight = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("insertColumnRight")),
  onClick: () => editor.chain().focus().addColumnAfter().run()
});

const moveColumnLeft = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("moveColumnLeft")),
  onClick: () => moveColumnLeftAction(editor)
});

const moveColumnRight = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("moveColumnRight")),
  onClick: () => moveColumnRightAction(editor)
});

const deleteColumn = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("deleteColumn")),
  onClick: () => editor.chain().focus().deleteColumn().run()
});

const splitCells = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("splitCells")),
  onClick: () => editor.chain().focus().splitCell().run()
});

const mergeCells = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("mergeCells")),
  onClick: () => editor.chain().focus().mergeCells().run()
});

const insertRowAbove = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("insertRowAbove")),
  onClick: () => editor.chain().focus().addRowBefore().run()
});

const insertRowBelow = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("insertRowBelow")),
  onClick: () => editor.chain().focus().addRowAfter().run()
});

const moveRowUp = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("moveRowUp")),
  onClick: () => moveRowUpAction(editor)
});
const moveRowDown = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("moveRowDown")),
  onClick: () => moveRowDownAction(editor)
});

const deleteRow = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("deleteRow")),
  onClick: () => editor.chain().focus().deleteRow().run()
});

const deleteTable = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("deleteTable")),
  onClick: () => editor.chain().focus().deleteTable().run()
});

const cellProperties = (editor: Editor): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("cellProperties")),
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
