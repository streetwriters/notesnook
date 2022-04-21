var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolButton } from "../components/tool-button";
import { Icons } from "../icons";
import { MenuPresenter } from "../../components/menu/menu";
import { useEffect, useRef, useState } from "react";
import { Dropdown } from "../components/dropdown";
import { Icon } from "../components/icon";
import { Box, Button, Flex, Text } from "rebass";
import { Popup } from "../components/popup";
var BlockTool = /** @class */ (function () {
    function BlockTool(id, title, icon, command) {
        var _this = this;
        this.id = id;
        this.title = title;
        this.icon = icon;
        this.command = command;
        this.render = function (props) {
            var editor = props.editor;
            return (_jsx(ToolButton, { id: _this.id, title: _this.title, icon: _this.icon, onClick: function () { return _this.command(editor); }, toggled: editor.isActive(_this.id) }));
        };
    }
    return BlockTool;
}());
var HorizontalRule = /** @class */ (function (_super) {
    __extends(HorizontalRule, _super);
    function HorizontalRule() {
        return _super.call(this, "horizontalRule", "Horizontal rule", "horizontalRule", function (editor) {
            return editor.chain().focus().setHorizontalRule().run();
        }) || this;
    }
    return HorizontalRule;
}(BlockTool));
export { HorizontalRule };
var CodeBlock = /** @class */ (function (_super) {
    __extends(CodeBlock, _super);
    function CodeBlock() {
        return _super.call(this, "codeblock", "Codeblock", "codeblock", function (editor) {
            return editor.chain().focus().toggleCodeBlock().run();
        }) || this;
    }
    return CodeBlock;
}(BlockTool));
export { CodeBlock };
var Blockquote = /** @class */ (function (_super) {
    __extends(Blockquote, _super);
    function Blockquote() {
        return _super.call(this, "blockquote", "Blockquote", "blockquote", function (editor) {
            return editor.chain().focus().toggleBlockquote().run();
        }) || this;
    }
    return Blockquote;
}(BlockTool));
export { Blockquote };
var Image = /** @class */ (function () {
    function Image() {
        this.id = "image";
        this.title = "Image";
        this.render = function (props) {
            var editor = props.editor;
            return (_jsx(_Fragment, { children: _jsx(Dropdown, { selectedItem: _jsx(Icon, { path: Icons.image, size: 16 }), items: [
                        {
                            key: "upload-from-disk",
                            type: "menuitem",
                            title: "Upload from disk",
                            icon: "upload",
                            onClick: function () { },
                        },
                        {
                            key: "upload-from-url",
                            type: "menuitem",
                            title: "Attach from URL",
                            icon: "link",
                            onClick: function () { },
                        },
                    ] }) }));
        };
    }
    return Image;
}());
export { Image };
var Table = /** @class */ (function () {
    function Table() {
        var _this = this;
        this.id = "table";
        this.title = "Table";
        this.MAX_COLUMNS = 20;
        this.MAX_ROWS = 20;
        this.MIN_COLUMNS = 4;
        this.MIN_ROWS = 4;
        this.render = function (props) {
            var editor = props.editor;
            var _a = __read(useState(false), 2), isOpen = _a[0], setIsOpen = _a[1];
            var ref = useRef(null);
            var _b = __read(useState({
                column: 0,
                row: 0,
            }), 2), cellLocation = _b[0], setCellLocation = _b[1];
            var _c = __read(useState({
                columns: _this.MIN_COLUMNS,
                rows: _this.MIN_ROWS,
            }), 2), tableSize = _c[0], setTableSize = _c[1];
            useEffect(function () {
                setTableSize(function (old) {
                    var columns = old.columns, rows = old.rows;
                    var column = cellLocation.column, row = cellLocation.row;
                    var isDecrease = row === rows - 2 || column === columns - 2;
                    var rowFactor = Number(row === rows || row === rows - 2);
                    var columnFactor = Number(column === columns || column === columns - 2);
                    return {
                        columns: isDecrease
                            ? Math.max(column + columnFactor, _this.MIN_COLUMNS)
                            : Math.min(old.columns + columnFactor, _this.MAX_COLUMNS),
                        rows: isDecrease
                            ? Math.max(row + rowFactor, _this.MIN_ROWS)
                            : Math.min(old.rows + rowFactor, _this.MAX_ROWS),
                    };
                });
            }, [cellLocation]);
            return (_jsxs(Flex, __assign({ ref: ref }, { children: [_jsxs(Button, __assign({ sx: {
                            p: 1,
                            m: 0,
                            bg: isOpen ? "hover" : "transparent",
                            mr: 1,
                            display: "flex",
                            alignItems: "center",
                            ":hover": { bg: "hover" },
                            ":last-of-type": {
                                mr: 0,
                            },
                        }, onClick: function () { return setIsOpen(function (s) { return !s; }); } }, { children: [_jsx(Icon, { path: Icons.table, color: "text", size: 18 }), _jsx(Icon, { path: Icons.chevronDown, color: "text", size: 18 })] })), _jsx(MenuPresenter, __assign({ isOpen: isOpen, onClose: function () { return setIsOpen(false); }, items: [], options: {
                            type: "menu",
                            position: {
                                target: ref.current || undefined,
                                isTargetAbsolute: true,
                                location: "below",
                                yOffset: 5,
                            },
                        } }, { children: _jsx(Popup, { children: _jsxs(Flex, __assign({ sx: { p: 1, flexDirection: "column", alignItems: "center" } }, { children: [_jsx(Box, __assign({ sx: {
                                            display: "grid",
                                            gridTemplateColumns: "1fr ".repeat(tableSize.columns),
                                            gap: "3px",
                                            bg: "background",
                                        } }, { children: Array(tableSize.columns * tableSize.rows)
                                            .fill(0)
                                            .map(function (_, index) { return (_jsx(Box, { width: 15, height: 15, sx: {
                                                border: "1px solid var(--disabled)",
                                                borderRadius: "2px",
                                                bg: _this.isCellHighlighted(index, cellLocation, tableSize)
                                                    ? "disabled"
                                                    : "transparent",
                                                ":hover": {
                                                    bg: "disabled",
                                                },
                                            }, onMouseEnter: function () {
                                                setCellLocation(_this.getCellLocation(index, tableSize));
                                            }, onClick: function () {
                                                editor
                                                    .chain()
                                                    .focus()
                                                    .insertTable({
                                                    cols: cellLocation.column,
                                                    rows: cellLocation.row,
                                                })
                                                    .run();
                                                setIsOpen(false);
                                            } })); }) })), _jsxs(Text, __assign({ variant: "body", sx: { mt: 1 } }, { children: [cellLocation.column, "x", cellLocation.row] }))] })) }) }))] })));
        };
    }
    Table.prototype.getCellLocation = function (index, tableSize) {
        var cellIndex = index + 1;
        var column = cellIndex % tableSize.columns;
        var row = cellIndex / tableSize.columns;
        var flooredRow = Math.floor(row);
        row = row === flooredRow ? row : flooredRow + 1;
        return { column: column ? column : tableSize.columns, row: row };
    };
    Table.prototype.isCellHighlighted = function (index, currentCellLocation, tableSize) {
        var cellLocation = this.getCellLocation(index, tableSize);
        return (cellLocation.row <= currentCellLocation.row &&
            cellLocation.column <= currentCellLocation.column);
    };
    return Table;
}());
export { Table };
