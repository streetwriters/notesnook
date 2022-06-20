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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Flex } from "rebass";
import { SelectionBasedNodeView, } from "../react";
import { useEffect, useRef } from "react";
import { updateColumnsOnResize } from "prosemirror-tables";
import { InsertColumnRight, InsertRowBelow, RowProperties, TableProperties, } from "../../toolbar/tools/table";
import { getToolDefinition } from "../../toolbar/tool-definitions";
import { getPosition } from "../../utils/position";
import { findSelectedDOMNode } from "../../toolbar/utils/prosemirror";
export function TableComponent(props) {
    var editor = props.editor, node = props.node, forwardRef = props.forwardRef;
    var colgroupRef = useRef(null);
    var tableRef = useRef();
    var selected = editor.isActive("table");
    useEffect(function () {
        if (!colgroupRef.current || !tableRef.current)
            return;
        updateColumnsOnResize(node, colgroupRef.current, tableRef.current, 50);
    }, [node]);
    return (_jsxs(_Fragment, { children: [selected && (_jsxs(_Fragment, { children: [_jsx(TableRowToolbar, { editor: editor, table: tableRef.current }), _jsx(TableColumnToolbar, { editor: editor, table: tableRef.current })] })), _jsx("div", __assign({ className: "tableWrapper" }, { children: _jsx("table", __assign({ ref: function (ref) {
                        forwardRef === null || forwardRef === void 0 ? void 0 : forwardRef(ref);
                        tableRef.current = ref || undefined;
                    } }, { children: _jsx("colgroup", { ref: colgroupRef }) })) }))] }));
}
export function TableNodeView(editor) {
    var TableNode = /** @class */ (function (_super) {
        __extends(TableNode, _super);
        function TableNode(node, cellMinWidth) {
            var _this = _super.call(this, node, editor, function () { return 0; }, // todo
            editor.storage.portalProviderAPI, editor.storage.eventDispatcher, {
                component: TableComponent,
                shouldUpdate: function (prev, next) {
                    return prev.type === next.type;
                },
                contentDOMFactory: function () {
                    var dom = document.createElement("tbody");
                    return { dom: dom };
                },
                wrapperFactory: function () {
                    var dom = document.createElement("div");
                    dom.style.position = "relative";
                    return dom;
                },
            }) || this;
            _super.prototype.init.call(_this);
            return _this;
        }
        return TableNode;
    }(SelectionBasedNodeView));
    return TableNode;
}
function TableRowToolbar(props) {
    var editor = props.editor;
    var rowToolsRef = useRef(null);
    useEffect(function () {
        if (!rowToolsRef.current) {
            return;
        }
        var currentRow = findSelectedDOMNode(editor, ["tableRow"]);
        if (!currentRow)
            return;
        var pos = getPosition(rowToolsRef.current, {
            location: "left",
            target: currentRow,
            align: "start",
            xOffset: -5,
            yOffset: -3,
        });
        rowToolsRef.current.style.top = "".concat(pos.top, "px");
        rowToolsRef.current.style.left = "".concat(pos.left, "px");
    }, [editor.state.selection, rowToolsRef.current]);
    return (_jsxs(Flex, __assign({ ref: rowToolsRef, sx: {
            zIndex: 999,
            top: 0,
            left: 0,
            position: "absolute",
            bg: "background",
            flexWrap: "nowrap",
            borderRadius: "default",
            opacity: 0.3,
            ":hover": {
                opacity: 1,
            },
        } }, { children: [_jsx(RowProperties, __assign({}, getToolDefinition("rowProperties"), { icon: "more", variant: "small", editor: editor })), _jsx(InsertRowBelow, __assign({}, getToolDefinition("insertRowBelow"), { editor: editor, variant: "small" }))] })));
}
function TableColumnToolbar(props) {
    var editor = props.editor, table = props.table;
    var columnToolsRef = useRef(null);
    useEffect(function () {
        if (!columnToolsRef.current || !table) {
            return;
        }
        var currentCell = findSelectedDOMNode(editor, [
            "tableCell",
            "tableHeader",
        ]);
        if (!currentCell)
            return;
        // tableRef.current
        var pos = getPosition(columnToolsRef.current, {
            location: "top",
            align: "center",
            target: currentCell,
            yAnchor: table,
            yOffset: 2,
        });
        columnToolsRef.current.style.left = "".concat(pos.left, "px");
        columnToolsRef.current.style.top = "".concat(pos.top, "px");
    }, [editor.state.selection, columnToolsRef.current, table]);
    return (_jsxs(Flex, __assign({ ref: columnToolsRef, sx: {
            zIndex: 999,
            top: 0,
            left: 0,
            position: "absolute",
            bg: "background",
            flexWrap: "nowrap",
            borderRadius: "default",
            opacity: 0.3,
            ":hover": {
                opacity: 1,
            },
        } }, { children: [_jsx(TableProperties, { editor: editor, title: "tableProperties", icon: "more", variant: "small" }), _jsx(InsertColumnRight, __assign({}, getToolDefinition("insertColumnRight"), { editor: editor, variant: "small", icon: "plus" }))] })));
}
