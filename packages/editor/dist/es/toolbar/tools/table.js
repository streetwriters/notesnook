import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { useCallback, useMemo, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { ResponsivePresenter } from "../../components/responsive";
import { moveColumnLeft as moveColumnLeftAction, moveColumnRight as moveColumnRightAction, moveRowDown as moveRowDownAction, moveRowUp as moveRowUpAction, } from "../../extensions/table/actions";
import { MoreTools } from "../components/more-tools";
import { menuButtonToTool } from "./utils";
import { getToolDefinition } from "../tool-definitions";
import { CellProperties as CellPropertiesPopup } from "../popups/cell-properties";
import { ColorTool } from "./colors";
import { Counter } from "../components/counter";
import { useToolbarLocation } from "../stores/toolbar-store";
import { showPopup } from "../../components/popup-presenter";
export function TableSettings(props) {
    const { editor } = props;
    const isBottom = useToolbarLocation() === "bottom";
    if (!editor.isActive("table") || !isBottom)
        return null;
    return (_jsx(MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "tableSettings", tools: [
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
        ] })));
}
export function RowProperties(props) {
    const { editor } = props;
    const buttonRef = useRef();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const items = useMemo(() => [
        insertRowAbove(editor),
        insertRowBelow(editor),
        moveRowUp(editor),
        moveRowDown(editor),
        deleteRow(editor),
    ], []);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, Object.assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: () => setIsMenuOpen(true) })), _jsx(ResponsivePresenter, { title: "Row properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: () => setIsMenuOpen(false), position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
export function ColumnProperties(props) {
    const { editor } = props;
    const buttonRef = useRef();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const items = useMemo(() => [
        insertColumnLeft(editor),
        insertColumnRight(editor),
        moveColumnLeft(editor),
        moveColumnRight(editor),
        deleteColumn(editor),
    ], []);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, Object.assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: () => setIsMenuOpen(true) })), _jsx(ResponsivePresenter, { title: "Column properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: () => setIsMenuOpen(false), position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
export function TableProperties(props) {
    const { editor } = props;
    const buttonRef = useRef();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const items = useMemo(() => [
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
    ], []);
    return (_jsxs(_Fragment, { children: [_jsx(ToolButton, Object.assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: () => setIsMenuOpen(true) })), _jsx(ResponsivePresenter, { title: "Table properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: () => setIsMenuOpen(false), position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
export function CellProperties(props) {
    return (_jsx(_Fragment, { children: _jsx(MoreTools, Object.assign({}, props, { popupId: "cellProperties", tools: [
                "mergeCells",
                "splitCells",
                "cellBackgroundColor",
                "cellTextColor",
                "cellBorderColor",
                "cellBorderWidth",
            ] })) }));
}
export function CellBackgroundColor(props) {
    const { editor } = props;
    return (_jsx(ColorTool, Object.assign({}, props, { cacheKey: "cellBackgroundColor", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").backgroundColor; }, title: "Cell background color", onColorChange: (color) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().setCellAttribute("backgroundColor", color).run(); } })));
}
export function CellTextColor(props) {
    const { editor } = props;
    return (_jsx(ColorTool, Object.assign({}, props, { cacheKey: "cellTextColor", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").color; }, title: "Cell text color", onColorChange: (color) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setCellAttribute("color", color).run(); } })));
}
export function CellBorderColor(props) {
    const { editor } = props;
    return (_jsx(ColorTool, Object.assign({}, props, { cacheKey: "cellBorderColor", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").borderColor; }, title: "Cell border color", onColorChange: (color) => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setCellAttribute("borderColor", color).run();
        } })));
}
export function CellBorderWidth(props) {
    const { editor } = props;
    const { borderWidth: _borderWidth } = editor.getAttributes("tableCell");
    const borderWidth = _borderWidth ? _borderWidth : 1;
    const decreaseBorderWidth = useCallback(() => {
        return Math.max(1, borderWidth - 1);
    }, [borderWidth]);
    const increaseBorderWidth = useCallback(() => {
        return Math.min(10, borderWidth + 1);
    }, [borderWidth]);
    return (_jsxs(Flex, Object.assign({ sx: { justifyContent: "center", alignItems: "center" } }, { children: [_jsx(Text, Object.assign({ variant: "subBody", sx: { mx: 1 } }, { children: "Border width:" })), _jsx(Counter, { title: "cell border width", onDecrease: () => {
                    var _a;
                    return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", decreaseBorderWidth());
                }, onIncrease: () => {
                    var _a;
                    return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", increaseBorderWidth());
                }, onReset: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", 1); }, value: borderWidth + "px" })] })));
}
const insertColumnLeft = (editor) => (Object.assign(Object.assign({}, getToolDefinition("insertColumnLeft")), { key: "addColumnLeft", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addColumnBefore().run(); } }));
const insertColumnRight = (editor) => (Object.assign(Object.assign({}, getToolDefinition("insertColumnRight")), { key: "addColumnRight", type: "button", title: "Add column right", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addColumnAfter().run(); }, icon: "insertColumnRight" }));
const moveColumnLeft = (editor) => (Object.assign(Object.assign({}, getToolDefinition("moveColumnLeft")), { key: "moveColumnLeft", type: "button", onClick: () => moveColumnLeftAction(editor) }));
const moveColumnRight = (editor) => (Object.assign(Object.assign({}, getToolDefinition("moveColumnRight")), { key: "moveColumnRight", type: "button", onClick: () => moveColumnRightAction(editor) }));
const deleteColumn = (editor) => (Object.assign(Object.assign({}, getToolDefinition("deleteColumn")), { key: "deleteColumn", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteColumn().run(); } }));
const splitCells = (editor) => (Object.assign(Object.assign({}, getToolDefinition("splitCells")), { key: "splitCells", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().splitCell().run(); } }));
const mergeCells = (editor) => (Object.assign(Object.assign({}, getToolDefinition("mergeCells")), { key: "mergeCells", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().mergeCells().run(); } }));
const insertRowAbove = (editor) => (Object.assign(Object.assign({}, getToolDefinition("insertRowAbove")), { key: "insertRowAbove", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addRowBefore().run(); } }));
const insertRowBelow = (editor) => (Object.assign(Object.assign({}, getToolDefinition("insertRowBelow")), { key: "insertRowBelow", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addRowAfter().run(); } }));
const moveRowUp = (editor) => (Object.assign(Object.assign({}, getToolDefinition("moveRowUp")), { key: "moveRowUp", type: "button", onClick: () => moveRowUpAction(editor) }));
const moveRowDown = (editor) => (Object.assign(Object.assign({}, getToolDefinition("moveRowDown")), { key: "moveRowDown", type: "button", onClick: () => moveRowDownAction(editor) }));
const deleteRow = (editor) => (Object.assign(Object.assign({}, getToolDefinition("deleteRow")), { key: "deleteRow", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteRow().run(); } }));
const deleteTable = (editor) => (Object.assign(Object.assign({}, getToolDefinition("deleteTable")), { key: "deleteTable", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteTable().run(); } }));
const cellProperties = (editor) => (Object.assign(Object.assign({}, getToolDefinition("cellProperties")), { key: "cellProperties", type: "button", onClick: () => {
        showPopup({
            popup: (hide) => _jsx(CellPropertiesPopup, { onClose: hide, editor: editor }),
        });
    } }));
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
