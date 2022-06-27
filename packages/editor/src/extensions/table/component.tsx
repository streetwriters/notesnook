import { Flex } from "rebass";
import {
  SelectionBasedNodeView,
  SelectionBasedReactNodeViewProps,
} from "../react";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { Editor } from "@tiptap/core";
import { useEffect, useRef } from "react";
import { updateColumnsOnResize } from "prosemirror-tables";
import { NodeView } from "prosemirror-view";
import {
  InsertColumnRight,
  InsertRowBelow,
  RowProperties,
  TableProperties,
} from "../../toolbar/tools/table";
import { getToolDefinition } from "../../toolbar/tool-definitions";
import { getPosition } from "../../utils/position";
import { findSelectedDOMNode } from "../../toolbar/utils/prosemirror";
import { DesktopOnly } from "../../components/responsive";

export function TableComponent(props: SelectionBasedReactNodeViewProps) {
  const { editor, node, forwardRef } = props;
  const colgroupRef = useRef<HTMLTableColElement>(null);
  const tableRef = useRef<HTMLTableElement>();
  const selected = editor.isActive("table");

  useEffect(() => {
    if (!colgroupRef.current || !tableRef.current) return;

    updateColumnsOnResize(node, colgroupRef.current, tableRef.current, 50);
  }, [node]);

  return (
    <>
      <DesktopOnly>
        {selected && (
          <>
            <TableRowToolbar editor={editor} table={tableRef.current} />
            <TableColumnToolbar editor={editor} table={tableRef.current} />
          </>
        )}
      </DesktopOnly>
      <div className="tableWrapper">
        <table
          ref={(ref) => {
            forwardRef?.(ref);
            tableRef.current = ref || undefined;
          }}
        >
          <colgroup ref={colgroupRef} />
          {/* <tbody /> */}
        </table>
      </div>
    </>
  );
}

export function TableNodeView(editor: Editor) {
  class TableNode
    extends SelectionBasedNodeView<SelectionBasedReactNodeViewProps<{}>>
    implements NodeView
  {
    constructor(node: ProsemirrorNode, cellMinWidth: number) {
      super(
        node,
        editor,
        () => 0, // todo
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
        }
      );
      super.init();
    }
  }
  return TableNode as unknown as NodeView;
}

type TableToolbarProps = {
  editor: Editor;
  table?: HTMLTableElement;
};

function TableRowToolbar(props: TableToolbarProps) {
  const { editor } = props;
  const rowToolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rowToolsRef.current) {
      return;
    }

    const currentRow = findSelectedDOMNode(editor, ["tableRow"]);
    if (!currentRow) return;

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

  return (
    <Flex
      ref={rowToolsRef}
      sx={{
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
      }}
    >
      <RowProperties
        {...getToolDefinition("rowProperties")}
        icon="more"
        variant="small"
        editor={editor}
      />
      <InsertRowBelow
        {...getToolDefinition("insertRowBelow")}
        editor={editor}
        variant="small"
      />
    </Flex>
  );
}

function TableColumnToolbar(props: TableToolbarProps) {
  const { editor, table } = props;
  const columnToolsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!columnToolsRef.current || !table) {
      return;
    }

    const currentCell = findSelectedDOMNode(editor, [
      "tableCell",
      "tableHeader",
    ]);
    if (!currentCell) return;

    // tableRef.current
    const pos = getPosition(columnToolsRef.current, {
      location: "top",
      align: "center",
      target: currentCell as HTMLElement,
      yAnchor: table,
      yOffset: 2,
    });

    columnToolsRef.current.style.left = `${pos.left}px`;
    columnToolsRef.current.style.top = `${pos.top}px`;
  }, [editor.state.selection, columnToolsRef.current, table]);

  return (
    <Flex
      ref={columnToolsRef}
      sx={{
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
      }}
    >
      <TableProperties
        editor={editor}
        title="tableProperties"
        icon="more"
        variant={"small"}
      />
      <InsertColumnRight
        {...getToolDefinition("insertColumnRight")}
        editor={editor}
        variant={"small"}
        icon="plus"
      />
    </Flex>
  );
}
