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

import { q } from "../../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../../queries/use-query.js";
import { ToolProps } from "../types.js";
import type { EditorController } from "../../controller.js";
import { ToolButton } from "../components/tool-button.js";
import { useCallback, useMemo, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import type { MenuButtonItem, MenuItem, UIElement } from "@ui";
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
  const isTable = useEditorQuery(editor, q.isActive("table"), false);
  const isBottom = useToolbarLocation() === "bottom";
  if (!isTable || !isBottom) return null;

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
        "deleteTable",
        "exportToCSV"
      ]}
    />
  );
}

export function RowProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<UIElement>(null);
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
        icon={props.icon}
        title={props.title}
        variant={props.variant}
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
        anchorRef={buttonRef}
        placement="bottom-start"
        items={items}
      />
    </>
  );
}

export function ColumnProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<UIElement>(null);
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
        icon={props.icon}
        title={props.title}
        variant={props.variant}
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
        anchorRef={buttonRef}
        placement="bottom-start"
        items={items}
      />
    </>
  );
}

export function TableProperties(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<UIElement>(null);
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
        icon={props.icon}
        title={props.title}
        variant={props.variant}
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
        anchorRef={buttonRef}
        placement="bottom-start"
        items={items}
      />
    </>
  );
}

export function CellProperties(props: ToolProps) {
  const { editor } = props;
  const isTable = useEditorQuery(editor, q.isActive("table"), false);
  const isBottom = useToolbarLocation() === "bottom";
  if (!isTable || !isBottom) return null;

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

const setCellAttribute = (
  editor: EditorController,
  name: string,
  value: unknown
) => editor.run({ name: "setCellAttribute", args: [name, value] });

export function CellBackgroundColor(props: ToolProps) {
  const { editor } = props;
  const cell = useEditorQuery(editor, q.attributes("tableCell"), {});

  return (
    <ColorTool
      {...props}
      cacheKey="cellBackgroundColor"
      activeColor={cell.backgroundColor as string | undefined}
      title={strings.cellBackgroundColor()}
      type="background"
      onColorChange={(color) =>
        setCellAttribute(editor, "backgroundColor", color)
      }
    />
  );
}

export function CellTextColor(props: ToolProps) {
  const { editor } = props;
  const cell = useEditorQuery(editor, q.attributes("tableCell"), {});

  return (
    <ColorTool
      {...props}
      cacheKey="cellTextColor"
      type="text"
      activeColor={cell.color as string | undefined}
      title={strings.cellTextColor()}
      onColorChange={(color) => setCellAttribute(editor, "color", color)}
    />
  );
}

export function CellBorderColor(props: ToolProps) {
  const { editor } = props;
  const cell = useEditorQuery(editor, q.attributes("tableCell"), {});

  return (
    <ColorTool
      {...props}
      cacheKey="cellBorderColor"
      activeColor={cell.borderColor as string | undefined}
      type="border"
      title={strings.cellBorderColor()}
      onColorChange={(color) => setCellAttribute(editor, "borderColor", color)}
    />
  );
}

export function CellBorderWidth(props: ToolProps) {
  const { editor } = props;
  const { borderWidth: _borderWidth } = useEditorQuery(
    editor,
    q.attributes("tableCell"),
    {}
  ) as { borderWidth?: string | number };
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
        setCellAttribute(editor, "borderWidth", decreaseBorderWidth())
      }
      onIncrease={() =>
        setCellAttribute(editor, "borderWidth", increaseBorderWidth())
      }
      onReset={() => setCellAttribute(editor, "borderWidth", 1)}
      value={borderWidth + "px"}
    />
  );
}

const insertColumnLeft = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("insertColumnLeft")),
  onClick: () =>
    editor.run(
      { name: "addColumnBefore" },
      { name: "selectTableColumn", args: ["prev"] }
    )
});

const insertColumnRight = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("insertColumnRight")),
  onClick: () =>
    editor.run(
      { name: "addColumnAfter" },
      { name: "selectTableColumn", args: ["next"] }
    )
});

const moveColumnLeft = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("moveColumnLeft")),
  onClick: () => editor.run({ name: "moveColumnLeft" })
});

const moveColumnRight = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("moveColumnRight")),
  onClick: () => editor.run({ name: "moveColumnRight" })
});

const deleteColumn = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("deleteColumn")),
  onClick: () => editor.run({ name: "deleteColumn" })
});

const splitCells = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("splitCells")),
  onClick: () => editor.run({ name: "splitCell" })
});

const mergeCells = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("mergeCells")),
  onClick: () => editor.run({ name: "mergeCells" })
});

const insertRowAbove = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("insertRowAbove")),
  onClick: () =>
    editor.run(
      { name: "addRowBefore" },
      { name: "selectTableRow", args: ["prev"] }
    )
});

const insertRowBelow = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("insertRowBelow")),
  onClick: () =>
    editor.run(
      { name: "addRowAfter" },
      { name: "selectTableRow", args: ["next"] }
    )
});

const moveRowUp = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("moveRowUp")),
  onClick: () => editor.run({ name: "moveRowUp" })
});
const moveRowDown = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("moveRowDown")),
  onClick: () => editor.run({ name: "moveRowDown" })
});

const deleteRow = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("deleteRow")),
  onClick: () => editor.run({ name: "deleteRow" })
});

const deleteTable = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("deleteTable")),
  onClick: () => editor.run({ name: "deleteTable" })
});

const cellProperties = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("cellProperties")),
  onClick: () => {
    showPopup({
      popup: (hide) => <CellPropertiesPopup onClose={hide} editor={editor} />,
      editor,
      anchor: "selection",
      placement: "bottom-start"
    });
  }
});

const exportToCSV = (editor: EditorController): MenuButtonItem => ({
  ...toolToMenuButton(getToolDefinition("exportToCSV")),
  onClick: () => editor.run({ name: "exportTableAsCsv" })
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
