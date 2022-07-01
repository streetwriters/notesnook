"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableNodeView = exports.TableComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const rebass_1 = require("rebass");
const react_1 = require("../react");
const react_2 = require("react");
const prosemirror_tables_1 = require("@_ueberdosis/prosemirror-tables");
const table_1 = require("../../toolbar/tools/table");
const tooldefinitions_1 = require("../../toolbar/tooldefinitions");
const position_1 = require("../../utils/position");
const prosemirror_1 = require("../../toolbar/utils/prosemirror");
const responsive_1 = require("../../components/responsive");
function TableComponent(props) {
    const { editor, node, forwardRef } = props;
    const colgroupRef = (0, react_2.useRef)(null);
    const tableRef = (0, react_2.useRef)();
    const selected = editor.isActive("table");
    (0, react_2.useEffect)(() => {
        if (!colgroupRef.current || !tableRef.current)
            return;
        (0, prosemirror_tables_1.updateColumnsOnResize)(node, colgroupRef.current, tableRef.current, 50);
    }, [node]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(responsive_1.DesktopOnly, { children: selected && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(TableRowToolbar, { editor: editor, table: tableRef.current }), (0, jsx_runtime_1.jsx)(TableColumnToolbar, { editor: editor, table: tableRef.current })] })) }), (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "tableWrapper" }, { children: (0, jsx_runtime_1.jsx)("table", Object.assign({ ref: (ref) => {
                        forwardRef === null || forwardRef === void 0 ? void 0 : forwardRef(ref);
                        tableRef.current = ref || undefined;
                    } }, { children: (0, jsx_runtime_1.jsx)("colgroup", { ref: colgroupRef }) })) }))] }));
}
exports.TableComponent = TableComponent;
function TableNodeView(editor) {
    class TableNode extends react_1.SelectionBasedNodeView {
        constructor(node, cellMinWidth) {
            super(node, editor, () => 0, // todo
            {
                component: TableComponent,
                shouldUpdate: (prev, next) => {
                    return prev.type === next.type;
                },
                contentDOMFactory: () => {
                    const dom = document.createElement("tbody");
                    return { dom };
                },
                wrapperFactory: () => {
                    const dom = document.createElement("div");
                    dom.style.position = "relative";
                    return dom;
                },
            });
            super.init();
        }
    }
    return TableNode;
}
exports.TableNodeView = TableNodeView;
function TableRowToolbar(props) {
    const { editor } = props;
    const rowToolsRef = (0, react_2.useRef)(null);
    (0, react_2.useEffect)(() => {
        if (!rowToolsRef.current) {
            return;
        }
        const currentRow = (0, prosemirror_1.findSelectedDOMNode)(editor, ["tableRow"]);
        if (!currentRow)
            return;
        const pos = (0, position_1.getPosition)(rowToolsRef.current, {
            location: "left",
            target: currentRow,
            align: "start",
            xOffset: -5,
            yOffset: -3,
        });
        rowToolsRef.current.style.top = `${pos.top}px`;
        rowToolsRef.current.style.left = `${pos.left}px`;
    }, [editor.state.selection, rowToolsRef.current]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ ref: rowToolsRef, sx: {
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
        } }, { children: [(0, jsx_runtime_1.jsx)(table_1.RowProperties, Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("rowProperties"), { icon: "more", variant: "small", editor: editor })), (0, jsx_runtime_1.jsx)(table_1.InsertRowBelow, Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("insertRowBelow"), { editor: editor, variant: "small" }))] })));
}
function TableColumnToolbar(props) {
    const { editor, table } = props;
    const columnToolsRef = (0, react_2.useRef)(null);
    (0, react_2.useEffect)(() => {
        if (!columnToolsRef.current || !table) {
            return;
        }
        const currentCell = (0, prosemirror_1.findSelectedDOMNode)(editor, [
            "tableCell",
            "tableHeader",
        ]);
        if (!currentCell)
            return;
        // tableRef.current
        const pos = (0, position_1.getPosition)(columnToolsRef.current, {
            location: "top",
            align: "center",
            target: currentCell,
            yAnchor: table,
            yOffset: 2,
        });
        columnToolsRef.current.style.left = `${pos.left}px`;
        columnToolsRef.current.style.top = `${pos.top}px`;
    }, [editor.state.selection, columnToolsRef.current, table]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ ref: columnToolsRef, sx: {
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
        } }, { children: [(0, jsx_runtime_1.jsx)(table_1.TableProperties, { editor: editor, title: "tableProperties", icon: "more", variant: "small" }), (0, jsx_runtime_1.jsx)(table_1.InsertColumnRight, Object.assign({}, (0, tooldefinitions_1.getToolDefinition)("insertColumnRight"), { editor: editor, variant: "small", icon: "plus" }))] })));
}
