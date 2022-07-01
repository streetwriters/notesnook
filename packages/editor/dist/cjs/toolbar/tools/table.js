"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTable = exports.DeleteRow = exports.MoveRowDown = exports.MoveRowUp = exports.InsertRowBelow = exports.InsertRowAbove = exports.MergeCells = exports.SplitCells = exports.DeleteColumn = exports.MoveColumnRight = exports.MoveColumnLeft = exports.InsertColumnRight = exports.InsertColumnLeft = exports.CellBorderWidth = exports.CellBorderColor = exports.CellTextColor = exports.CellBackgroundColor = exports.CellProperties = exports.TableProperties = exports.ColumnProperties = exports.RowProperties = exports.TableSettings = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const toolbutton_1 = require("../components/toolbutton");
const react_1 = require("react");
const rebass_1 = require("rebass");
const responsive_1 = require("../../components/responsive");
const actions_1 = require("../../extensions/table/actions");
const moretools_1 = require("../components/moretools");
const utils_1 = require("./utils");
const tooldefinitions_1 = require("../tooldefinitions");
const cellproperties_1 = require("../popups/cellproperties");
const colors_1 = require("./colors");
const counter_1 = require("../components/counter");
const toolbarstore_1 = require("../stores/toolbarstore");
const popuppresenter_1 = require("../../components/popuppresenter");
function TableSettings(props) {
    const { editor } = props;
    const isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("table") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, Object.assign({}, props, { autoCloseOnUnmount: true, popupId: "tableSettings", tools: [
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
exports.TableSettings = TableSettings;
function RowProperties(props) {
    const { editor } = props;
    const buttonRef = (0, react_1.useRef)();
    const [isMenuOpen, setIsMenuOpen] = (0, react_1.useState)(false);
    const items = (0, react_1.useMemo)(() => [
        insertRowAbove(editor),
        insertRowBelow(editor),
        moveRowUp(editor),
        moveRowDown(editor),
        deleteRow(editor),
    ], []);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: () => setIsMenuOpen(true) })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, { title: "Row properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: () => setIsMenuOpen(false), position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
exports.RowProperties = RowProperties;
function ColumnProperties(props) {
    const { editor } = props;
    const buttonRef = (0, react_1.useRef)();
    const [isMenuOpen, setIsMenuOpen] = (0, react_1.useState)(false);
    const items = (0, react_1.useMemo)(() => [
        insertColumnLeft(editor),
        insertColumnRight(editor),
        moveColumnLeft(editor),
        moveColumnRight(editor),
        deleteColumn(editor),
    ], []);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: () => setIsMenuOpen(true) })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, { title: "Column properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: () => setIsMenuOpen(false), position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
exports.ColumnProperties = ColumnProperties;
function TableProperties(props) {
    const { editor } = props;
    const buttonRef = (0, react_1.useRef)();
    const [isMenuOpen, setIsMenuOpen] = (0, react_1.useState)(false);
    const items = (0, react_1.useMemo)(() => [
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
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, Object.assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: () => setIsMenuOpen(true) })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, { title: "Table properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: () => setIsMenuOpen(false), position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
exports.TableProperties = TableProperties;
function CellProperties(props) {
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(moretools_1.MoreTools, Object.assign({}, props, { popupId: "cellProperties", tools: [
                "mergeCells",
                "splitCells",
                "cellBackgroundColor",
                "cellTextColor",
                "cellBorderColor",
                "cellBorderWidth",
            ] })) }));
}
exports.CellProperties = CellProperties;
function CellBackgroundColor(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(colors_1.ColorTool, Object.assign({}, props, { cacheKey: "cellBackgroundColor", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").backgroundColor; }, title: "Cell background color", onColorChange: (color) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().setCellAttribute("backgroundColor", color).run(); } })));
}
exports.CellBackgroundColor = CellBackgroundColor;
function CellTextColor(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(colors_1.ColorTool, Object.assign({}, props, { cacheKey: "cellTextColor", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").color; }, title: "Cell text color", onColorChange: (color) => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setCellAttribute("color", color).run(); } })));
}
exports.CellTextColor = CellTextColor;
function CellBorderColor(props) {
    const { editor } = props;
    return ((0, jsx_runtime_1.jsx)(colors_1.ColorTool, Object.assign({}, props, { cacheKey: "cellBorderColor", getActiveColor: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").borderColor; }, title: "Cell border color", onColorChange: (color) => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setCellAttribute("borderColor", color).run();
        } })));
}
exports.CellBorderColor = CellBorderColor;
function CellBorderWidth(props) {
    const { editor } = props;
    const { borderWidth: _borderWidth } = editor.getAttributes("tableCell");
    const borderWidth = _borderWidth ? _borderWidth : 1;
    const decreaseBorderWidth = (0, react_1.useCallback)(() => {
        return Math.max(1, borderWidth - 1);
    }, [borderWidth]);
    const increaseBorderWidth = (0, react_1.useCallback)(() => {
        return Math.min(10, borderWidth + 1);
    }, [borderWidth]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { justifyContent: "center", alignItems: "center" } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ variant: "subBody", sx: { mx: 1 } }, { children: "Border width:" })), (0, jsx_runtime_1.jsx)(counter_1.Counter, { title: "cell border width", onDecrease: () => {
                    var _a;
                    return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", decreaseBorderWidth());
                }, onIncrease: () => {
                    var _a;
                    return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", increaseBorderWidth());
                }, onReset: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", 1); }, value: borderWidth + "px" })] })));
}
exports.CellBorderWidth = CellBorderWidth;
const insertColumnLeft = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("insertColumnLeft")), { key: "addColumnLeft", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addColumnBefore().run(); } }));
const insertColumnRight = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("insertColumnRight")), { key: "addColumnRight", type: "button", title: "Add column right", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addColumnAfter().run(); }, icon: "insertColumnRight" }));
const moveColumnLeft = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("moveColumnLeft")), { key: "moveColumnLeft", type: "button", onClick: () => (0, actions_1.moveColumnLeft)(editor) }));
const moveColumnRight = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("moveColumnRight")), { key: "moveColumnRight", type: "button", onClick: () => (0, actions_1.moveColumnRight)(editor) }));
const deleteColumn = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("deleteColumn")), { key: "deleteColumn", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteColumn().run(); } }));
const splitCells = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("splitCells")), { key: "splitCells", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().splitCell().run(); } }));
const mergeCells = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("mergeCells")), { key: "mergeCells", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().mergeCells().run(); } }));
const insertRowAbove = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("insertRowAbove")), { key: "insertRowAbove", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addRowBefore().run(); } }));
const insertRowBelow = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("insertRowBelow")), { key: "insertRowBelow", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addRowAfter().run(); } }));
const moveRowUp = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("moveRowUp")), { key: "moveRowUp", type: "button", onClick: () => (0, actions_1.moveRowUp)(editor) }));
const moveRowDown = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("moveRowDown")), { key: "moveRowDown", type: "button", onClick: () => (0, actions_1.moveRowDown)(editor) }));
const deleteRow = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("deleteRow")), { key: "deleteRow", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteRow().run(); } }));
const deleteTable = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("deleteTable")), { key: "deleteTable", type: "button", onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteTable().run(); } }));
const cellProperties = (editor) => (Object.assign(Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("cellProperties")), { key: "cellProperties", type: "button", onClick: () => {
        (0, popuppresenter_1.showPopup)({
            theme: editor.storage.theme,
            popup: (hide) => (0, jsx_runtime_1.jsx)(cellproperties_1.CellProperties, { onClose: hide, editor: editor }),
        });
    } }));
exports.InsertColumnLeft = (0, utils_1.menuButtonToTool)(insertColumnLeft);
exports.InsertColumnRight = (0, utils_1.menuButtonToTool)(insertColumnRight);
exports.MoveColumnLeft = (0, utils_1.menuButtonToTool)(moveColumnLeft);
exports.MoveColumnRight = (0, utils_1.menuButtonToTool)(moveColumnRight);
exports.DeleteColumn = (0, utils_1.menuButtonToTool)(deleteColumn);
exports.SplitCells = (0, utils_1.menuButtonToTool)(splitCells);
exports.MergeCells = (0, utils_1.menuButtonToTool)(mergeCells);
exports.InsertRowAbove = (0, utils_1.menuButtonToTool)(insertRowAbove);
exports.InsertRowBelow = (0, utils_1.menuButtonToTool)(insertRowBelow);
exports.MoveRowUp = (0, utils_1.menuButtonToTool)(moveRowUp);
exports.MoveRowDown = (0, utils_1.menuButtonToTool)(moveRowDown);
exports.DeleteRow = (0, utils_1.menuButtonToTool)(deleteRow);
exports.DeleteTable = (0, utils_1.menuButtonToTool)(deleteTable);
