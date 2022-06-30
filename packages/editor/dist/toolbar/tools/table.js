"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTable = exports.DeleteRow = exports.MoveRowDown = exports.MoveRowUp = exports.InsertRowBelow = exports.InsertRowAbove = exports.MergeCells = exports.SplitCells = exports.DeleteColumn = exports.MoveColumnRight = exports.MoveColumnLeft = exports.InsertColumnRight = exports.InsertColumnLeft = exports.CellBorderWidth = exports.CellBorderColor = exports.CellTextColor = exports.CellBackgroundColor = exports.CellProperties = exports.TableProperties = exports.ColumnProperties = exports.RowProperties = exports.TableSettings = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var toolbutton_1 = require("../components/toolbutton");
var react_1 = require("react");
var rebass_1 = require("rebass");
var responsive_1 = require("../../components/responsive");
var actions_1 = require("../../extensions/table/actions");
var moretools_1 = require("../components/moretools");
var utils_1 = require("./utils");
var tooldefinitions_1 = require("../tooldefinitions");
var cellproperties_1 = require("../popups/cellproperties");
var colors_1 = require("./colors");
var counter_1 = require("../components/counter");
var toolbarstore_1 = require("../stores/toolbarstore");
var popuppresenter_1 = require("../../components/popuppresenter");
function TableSettings(props) {
    var editor = props.editor;
    var isBottom = (0, toolbarstore_1.useToolbarLocation)() === "bottom";
    if (!editor.isActive("table") || !isBottom)
        return null;
    return ((0, jsx_runtime_1.jsx)(moretools_1.MoreTools, __assign({}, props, { autoCloseOnUnmount: true, popupId: "tableSettings", tools: [
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
    var editor = props.editor;
    var buttonRef = (0, react_1.useRef)();
    var _a = __read((0, react_1.useState)(false), 2), isMenuOpen = _a[0], setIsMenuOpen = _a[1];
    var items = (0, react_1.useMemo)(function () { return [
        insertRowAbove(editor),
        insertRowBelow(editor),
        moveRowUp(editor),
        moveRowDown(editor),
        deleteRow(editor),
    ]; }, []);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: function () { return setIsMenuOpen(true); } })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, { title: "Row properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: function () { return setIsMenuOpen(false); }, position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
exports.RowProperties = RowProperties;
function ColumnProperties(props) {
    var editor = props.editor;
    var buttonRef = (0, react_1.useRef)();
    var _a = __read((0, react_1.useState)(false), 2), isMenuOpen = _a[0], setIsMenuOpen = _a[1];
    var items = (0, react_1.useMemo)(function () { return [
        insertColumnLeft(editor),
        insertColumnRight(editor),
        moveColumnLeft(editor),
        moveColumnRight(editor),
        deleteColumn(editor),
    ]; }, []);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: function () { return setIsMenuOpen(true); } })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, { title: "Column properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: function () { return setIsMenuOpen(false); }, position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
exports.ColumnProperties = ColumnProperties;
function TableProperties(props) {
    var editor = props.editor;
    var buttonRef = (0, react_1.useRef)();
    var _a = __read((0, react_1.useState)(false), 2), isMenuOpen = _a[0], setIsMenuOpen = _a[1];
    var items = (0, react_1.useMemo)(function () { return [
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
    ]; }, []);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, __assign({}, props, { buttonRef: buttonRef, toggled: isMenuOpen, onClick: function () { return setIsMenuOpen(true); } })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, { title: "Table properties", mobile: "sheet", desktop: "menu", isOpen: isMenuOpen, onClose: function () { return setIsMenuOpen(false); }, position: {
                    target: buttonRef.current,
                    isTargetAbsolute: true,
                    location: "below",
                    yOffset: 5,
                }, items: items })] }));
}
exports.TableProperties = TableProperties;
function CellProperties(props) {
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)(moretools_1.MoreTools, __assign({}, props, { popupId: "cellProperties", tools: [
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
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(colors_1.ColorTool, __assign({}, props, { cacheKey: "cellBackgroundColor", getActiveColor: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").backgroundColor; }, title: "Cell background color", onColorChange: function (color) { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().setCellAttribute("backgroundColor", color).run(); } })));
}
exports.CellBackgroundColor = CellBackgroundColor;
function CellTextColor(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(colors_1.ColorTool, __assign({}, props, { cacheKey: "cellTextColor", getActiveColor: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").color; }, title: "Cell text color", onColorChange: function (color) { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setCellAttribute("color", color).run(); } })));
}
exports.CellTextColor = CellTextColor;
function CellBorderColor(props) {
    var editor = props.editor;
    return ((0, jsx_runtime_1.jsx)(colors_1.ColorTool, __assign({}, props, { cacheKey: "cellBorderColor", getActiveColor: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.getAttributes("tableCell").borderColor; }, title: "Cell border color", onColorChange: function (color) {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setCellAttribute("borderColor", color).run();
        } })));
}
exports.CellBorderColor = CellBorderColor;
function CellBorderWidth(props) {
    var editor = props.editor;
    var _borderWidth = editor.getAttributes("tableCell").borderWidth;
    var borderWidth = _borderWidth ? _borderWidth : 1;
    var decreaseBorderWidth = (0, react_1.useCallback)(function () {
        return Math.max(1, borderWidth - 1);
    }, [borderWidth]);
    var increaseBorderWidth = (0, react_1.useCallback)(function () {
        return Math.min(10, borderWidth + 1);
    }, [borderWidth]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { justifyContent: "center", alignItems: "center" } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "subBody", sx: { mx: 1 } }, { children: "Border width:" })), (0, jsx_runtime_1.jsx)(counter_1.Counter, { title: "cell border width", onDecrease: function () {
                    var _a;
                    return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", decreaseBorderWidth());
                }, onIncrease: function () {
                    var _a;
                    return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", increaseBorderWidth());
                }, onReset: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.commands.setCellAttribute("borderWidth", 1); }, value: borderWidth + "px" })] })));
}
exports.CellBorderWidth = CellBorderWidth;
var insertColumnLeft = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("insertColumnLeft")), { key: "addColumnLeft", type: "button", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addColumnBefore().run(); } })); };
var insertColumnRight = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("insertColumnRight")), { key: "addColumnRight", type: "button", title: "Add column right", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addColumnAfter().run(); }, icon: "insertColumnRight" })); };
var moveColumnLeft = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("moveColumnLeft")), { key: "moveColumnLeft", type: "button", onClick: function () { return (0, actions_1.moveColumnLeft)(editor); } })); };
var moveColumnRight = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("moveColumnRight")), { key: "moveColumnRight", type: "button", onClick: function () { return (0, actions_1.moveColumnRight)(editor); } })); };
var deleteColumn = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("deleteColumn")), { key: "deleteColumn", type: "button", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteColumn().run(); } })); };
var splitCells = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("splitCells")), { key: "splitCells", type: "button", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().splitCell().run(); } })); };
var mergeCells = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("mergeCells")), { key: "mergeCells", type: "button", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().mergeCells().run(); } })); };
var insertRowAbove = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("insertRowAbove")), { key: "insertRowAbove", type: "button", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addRowBefore().run(); } })); };
var insertRowBelow = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("insertRowBelow")), { key: "insertRowBelow", type: "button", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().addRowAfter().run(); } })); };
var moveRowUp = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("moveRowUp")), { key: "moveRowUp", type: "button", onClick: function () { return (0, actions_1.moveRowUp)(editor); } })); };
var moveRowDown = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("moveRowDown")), { key: "moveRowDown", type: "button", onClick: function () { return (0, actions_1.moveRowDown)(editor); } })); };
var deleteRow = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("deleteRow")), { key: "deleteRow", type: "button", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteRow().run(); } })); };
var deleteTable = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("deleteTable")), { key: "deleteTable", type: "button", onClick: function () { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().deleteTable().run(); } })); };
var cellProperties = function (editor) { return (__assign(__assign({}, (0, tooldefinitions_1.getToolDefinition)("cellProperties")), { key: "cellProperties", type: "button", onClick: function () {
        (0, popuppresenter_1.showPopup)({
            theme: editor.storage.theme,
            popup: function (hide) { return (0, jsx_runtime_1.jsx)(cellproperties_1.CellProperties, { onClose: hide, editor: editor }); },
        });
    } })); };
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
