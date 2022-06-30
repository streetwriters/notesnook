"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableNodeView = exports.TableComponent = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var rebass_1 = require("rebass");
var react_1 = require("../react");
var react_2 = require("react");
var prosemirror_tables_1 = require("@_ueberdosis/prosemirror-tables");
var table_1 = require("../../toolbar/tools/table");
var tooldefinitions_1 = require("../../toolbar/tooldefinitions");
var position_1 = require("../../utils/position");
var prosemirror_1 = require("../../toolbar/utils/prosemirror");
var responsive_1 = require("../../components/responsive");
function TableComponent(props) {
    var editor = props.editor, node = props.node, forwardRef = props.forwardRef;
    var colgroupRef = (0, react_2.useRef)(null);
    var tableRef = (0, react_2.useRef)();
    var selected = editor.isActive("table");
    (0, react_2.useEffect)(function () {
        if (!colgroupRef.current || !tableRef.current)
            return;
        (0, prosemirror_tables_1.updateColumnsOnResize)(node, colgroupRef.current, tableRef.current, 50);
    }, [node]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: selected && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(TableRowToolbar, { editor: editor, table: tableRef.current }), (0, jsx_runtime_1.jsx)(TableColumnToolbar, { editor: editor, table: tableRef.current })] })) }), (0, jsx_runtime_1.jsx)("div", __assign({ className: "tableWrapper" }, { children: (0, jsx_runtime_1.jsx)("table", __assign({ ref: function (ref) {
                        forwardRef === null || forwardRef === void 0 ? void 0 : forwardRef(ref);
                        tableRef.current = ref || undefined;
                    } }, { children: (0, jsx_runtime_1.jsx)("colgroup", { ref: colgroupRef }) })) }))] }));
}
exports.TableComponent = TableComponent;
function TableNodeView(editor) {
    var TableNode = /** @class */ (function (_super) {
        __extends(TableNode, _super);
        function TableNode(node, cellMinWidth) {
            var _this = _super.call(this, node, editor, function () { return 0; }, // todo
            {
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
    }(react_1.SelectionBasedNodeView));
    return TableNode;
}
exports.TableNodeView = TableNodeView;
function TableRowToolbar(props) {
    var editor = props.editor;
    var rowToolsRef = (0, react_2.useRef)(null);
    (0, react_2.useEffect)(function () {
        if (!rowToolsRef.current) {
            return;
        }
        var currentRow = (0, prosemirror_1.findSelectedDOMNode)(editor, ["tableRow"]);
        if (!currentRow)
            return;
        var pos = (0, position_1.getPosition)(rowToolsRef.current, {
            location: "left",
            target: currentRow,
            align: "start",
            xOffset: -5,
            yOffset: -3,
        });
        rowToolsRef.current.style.top = "".concat(pos.top, "px");
        rowToolsRef.current.style.left = "".concat(pos.left, "px");
    }, [editor.state.selection, rowToolsRef.current]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ ref: rowToolsRef, sx: {
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
        } }, { children: [(0, jsx_runtime_1.jsx)(table_1.RowProperties, __assign({}, (0, tooldefinitions_1.getToolDefinition)("rowProperties"), { icon: "more", variant: "small", editor: editor })), (0, jsx_runtime_1.jsx)(table_1.InsertRowBelow, __assign({}, (0, tooldefinitions_1.getToolDefinition)("insertRowBelow"), { editor: editor, variant: "small" }))] })));
}
function TableColumnToolbar(props) {
    var editor = props.editor, table = props.table;
    var columnToolsRef = (0, react_2.useRef)(null);
    (0, react_2.useEffect)(function () {
        if (!columnToolsRef.current || !table) {
            return;
        }
        var currentCell = (0, prosemirror_1.findSelectedDOMNode)(editor, [
            "tableCell",
            "tableHeader",
        ]);
        if (!currentCell)
            return;
        // tableRef.current
        var pos = (0, position_1.getPosition)(columnToolsRef.current, {
            location: "top",
            align: "center",
            target: currentCell,
            yAnchor: table,
            yOffset: 2,
        });
        columnToolsRef.current.style.left = "".concat(pos.left, "px");
        columnToolsRef.current.style.top = "".concat(pos.top, "px");
    }, [editor.state.selection, columnToolsRef.current, table]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ ref: columnToolsRef, sx: {
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
        } }, { children: [(0, jsx_runtime_1.jsx)(table_1.TableProperties, { editor: editor, title: "tableProperties", icon: "more", variant: "small" }), (0, jsx_runtime_1.jsx)(table_1.InsertColumnRight, __assign({}, (0, tooldefinitions_1.getToolDefinition)("insertColumnRight"), { editor: editor, variant: "small", icon: "plus" }))] })));
}
