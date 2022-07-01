import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Flex } from "rebass";
import { SelectionBasedNodeView, } from "../react";
import { useEffect, useRef } from "react";
import { updateColumnsOnResize } from "@_ueberdosis/prosemirror-tables";
import { InsertColumnRight, InsertRowBelow, RowProperties, TableProperties, } from "../../toolbar/tools/table";
import { getToolDefinition } from "../../toolbar/tool-definitions";
import { getPosition } from "../../utils/position";
import { findSelectedDOMNode } from "../../toolbar/utils/prosemirror";
import { DesktopOnly } from "../../components/responsive";
export function TableComponent(props) {
    const { editor, node, forwardRef } = props;
    const colgroupRef = useRef(null);
    const tableRef = useRef();
    const selected = editor.isActive("table");
    useEffect(() => {
        if (!colgroupRef.current || !tableRef.current)
            return;
        updateColumnsOnResize(node, colgroupRef.current, tableRef.current, 50);
    }, [node]);
    return (_jsxs(_Fragment, { children: [_jsx(DesktopOnly, { children: selected && (_jsxs(_Fragment, { children: [_jsx(TableRowToolbar, { editor: editor, table: tableRef.current }), _jsx(TableColumnToolbar, { editor: editor, table: tableRef.current })] })) }), _jsx("div", Object.assign({ className: "tableWrapper" }, { children: _jsx("table", Object.assign({ ref: (ref) => {
                        forwardRef === null || forwardRef === void 0 ? void 0 : forwardRef(ref);
                        tableRef.current = ref || undefined;
                    } }, { children: _jsx("colgroup", { ref: colgroupRef }) })) }))] }));
}
export function TableNodeView(editor) {
    class TableNode extends SelectionBasedNodeView {
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
function TableRowToolbar(props) {
    const { editor } = props;
    const rowToolsRef = useRef(null);
    useEffect(() => {
        if (!rowToolsRef.current) {
            return;
        }
        const currentRow = findSelectedDOMNode(editor, ["tableRow"]);
        if (!currentRow)
            return;
        const pos = getPosition(rowToolsRef.current, {
            location: "left",
            target: currentRow,
            align: "start",
            xOffset: -5,
            yOffset: -3,
        });
        rowToolsRef.current.style.top = `${pos.top}px`;
        rowToolsRef.current.style.left = `${pos.left}px`;
    }, [editor.state.selection, rowToolsRef.current]);
    return (_jsxs(Flex, Object.assign({ ref: rowToolsRef, sx: {
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
        } }, { children: [_jsx(RowProperties, Object.assign({}, getToolDefinition("rowProperties"), { icon: "more", variant: "small", editor: editor })), _jsx(InsertRowBelow, Object.assign({}, getToolDefinition("insertRowBelow"), { editor: editor, variant: "small" }))] })));
}
function TableColumnToolbar(props) {
    const { editor, table } = props;
    const columnToolsRef = useRef(null);
    useEffect(() => {
        if (!columnToolsRef.current || !table) {
            return;
        }
        const currentCell = findSelectedDOMNode(editor, [
            "tableCell",
            "tableHeader",
        ]);
        if (!currentCell)
            return;
        // tableRef.current
        const pos = getPosition(columnToolsRef.current, {
            location: "top",
            align: "center",
            target: currentCell,
            yAnchor: table,
            yOffset: 2,
        });
        columnToolsRef.current.style.left = `${pos.left}px`;
        columnToolsRef.current.style.top = `${pos.top}px`;
    }, [editor.state.selection, columnToolsRef.current, table]);
    return (_jsxs(Flex, Object.assign({ ref: columnToolsRef, sx: {
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
        } }, { children: [_jsx(TableProperties, { editor: editor, title: "tableProperties", icon: "more", variant: "small" }), _jsx(InsertColumnRight, Object.assign({}, getToolDefinition("insertColumnRight"), { editor: editor, variant: "small", icon: "plus" }))] })));
}
