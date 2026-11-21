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

import { Flex } from "@theme-ui/components";
import { ReactNodeView, ReactNodeViewProps } from "../react/index.js";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { Editor as TiptapEditor } from "@tiptap/core";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { EditorView, NodeView } from "prosemirror-view";
import { getPosition } from "@notesnook/ui";
import {
  type AnchorRect,
  type EditorController,
  InsertColumnRight,
  InsertRowBelow,
  RowProperties,
  TableProperties,
  getToolDefinition,
  hasSameAttributes,
  DesktopOnly,
  q,
  tiptapController,
  useControllerQuery
} from "@notesnook/editor-ui";
import { TextDirections } from "../text-direction/index.js";
import { strings } from "@notesnook/intl";
import { updateColumnsOnResize } from "./prosemirror-tables/tableview.js";

export function TableComponent(
  props: ReactNodeViewProps & { cellMinWidth: number }
) {
  const { editor, node, forwardRef, cellMinWidth } = props;
  const colgroupRef = useRef<HTMLTableColElement>(null);
  const tableRef = useRef<HTMLTableElement>();
  const { textDirection } = node.attrs;
  const controller = useMemo(() => tiptapController(editor), [editor]);
  const editableQuery = useMemo(() => q.editable(), []);
  const isEditable = useControllerQuery(
    controller,
    editableQuery,
    editor.isEditable
  );

  useEffect(() => {
    if (!colgroupRef.current || !tableRef.current) return;

    updateColumnsOnResize(
      node,
      colgroupRef.current,
      tableRef.current,
      cellMinWidth
    );
  }, [node, cellMinWidth]);

  return (
    <>
      <DesktopOnly>
        {isEditable ? (
          <>
            <TableRowToolbar
              editor={controller}
              table={tableRef}
              textDirection={textDirection}
            />
            <TableColumnToolbar
              editor={controller}
              table={tableRef}
              textDirection={textDirection}
            />
          </>
        ) : null}
      </DesktopOnly>
      <div
        dir={textDirection}
        className="scroll-bar"
        style={{
          overflowY: "hidden",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          maxWidth: "100%"
        }}
      >
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

export function TableNodeView(editor: TiptapEditor) {
  class TableNode
    extends ReactNodeView<
      ReactNodeViewProps<unknown> & { cellMinWidth: number }
    >
    implements NodeView
  {
    constructor(node: ProsemirrorNode, cellMinWidth: number) {
      super(
        node,
        editor,
        () => 0, // todo
        {
          component: TableComponent,
          props: { cellMinWidth },
          forceEnableSelection: true,
          shouldUpdate: (prev, next) => {
            return (
              !hasSameAttributes(prev.attrs, next.attrs) ||
              prev.childCount !== next.childCount ||
              // compare columns
              prev.firstChild?.childCount !== next.firstChild?.childCount
            );
          },
          contentDOMFactory: () => {
            const dom = document.createElement("tbody");
            return { dom };
          },
          wrapperFactory: () => {
            const dom = document.createElement("div");
            dom.style.position = "relative";
            return dom;
          }
        }
      );
      super.init();
    }
  }
  return TableNode as unknown as new (
    node: ProsemirrorNode,
    cellMinWidth: number,
    view: EditorView
  ) => NodeView;
}

type TableToolbarProps = {
  editor: EditorController;
  table?: React.MutableRefObject<HTMLTableElement | undefined>;
  textDirection: TextDirections;
};

const ROW_TYPES = ["tableRow"];
const CELL_TYPES = ["tableCell", "tableHeader"];

/** A positioning target that is a rectangle, not an element. */
function rectTarget(rect: AnchorRect, context: Element): HTMLElement {
  return {
    contextElement: context,
    getBoundingClientRect: () =>
      new DOMRect(
        rect.left,
        rect.top,
        rect.right - rect.left,
        rect.bottom - rect.top
      )
  } as unknown as HTMLElement;
}

/**
 * The box of the selected node of the given types, but only when it is inside
 * this table (the selection may be in another one).
 */
function useTableAnchor(
  editor: EditorController,
  types: string[],
  table?: React.MutableRefObject<HTMLTableElement | undefined>
): AnchorRect | null {
  const query = useMemo(() => q.anchor({ node: types }), [types]);
  const anchor = useControllerQuery(editor, query, null);
  const [inside, setInside] = useState<AnchorRect | null>(null);
  useLayoutEffect(() => {
    const tableRect = table?.current?.getBoundingClientRect();
    const contained =
      !!anchor &&
      !!tableRect &&
      anchor.top >= tableRect.top - 1 &&
      anchor.bottom <= tableRect.bottom + 1 &&
      anchor.left >= tableRect.left - 1 &&
      anchor.right <= tableRect.right + 1;
    setInside(contained ? anchor : null);
  }, [anchor, table]);
  return inside;
}

function TableRowToolbar(props: TableToolbarProps) {
  const { editor, textDirection, table } = props;
  const rowToolsRef = useRef<HTMLDivElement>(null);
  const row = useTableAnchor(editor, ROW_TYPES, table);

  useLayoutEffect(() => {
    const rowTools = rowToolsRef.current;
    if (!rowTools || !table?.current) return;
    if (!row) {
      rowTools.style.display = "none";
      return;
    }
    rowTools.style.display = "flex";
    let cancelled = false;
    getPosition(rowTools, {
      location: textDirection ? "right" : "left",
      target: rectTarget(row, table.current),
      align: "start",
      xOffset: textDirection ? 5 : -5,
      yOffset: -3
    }).then(({ top, left }) => {
      if (cancelled) return;
      rowTools.style.top = `${top}px`;
      rowTools.style.left = `${left}px`;
    });
    return () => {
      cancelled = true;
    };
  }, [row, textDirection, table]);

  return (
    <Flex
      ref={rowToolsRef}
      sx={{
        display: "none",
        zIndex: 999,
        top: 0,
        left: 0,
        position: "absolute",
        bg: "background",
        flexWrap: "nowrap",
        borderRadius: "default",
        border: "1px solid var(--border)",
        flexDirection: "column",
        opacity: 0.4,
        ":hover": {
          opacity: 1
        }
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
  const cell = useTableAnchor(editor, CELL_TYPES, table);
  // The cell's box is measured when the selection changes; horizontal scrolling
  // of the table moves it afterwards, so track how far.
  const scrollAtMeasure = useRef(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const scrollContainer = table?.current?.parentElement;
    if (!scrollContainer) return;
    scrollAtMeasure.current = scrollContainer.scrollLeft;
    setScrollLeft(scrollContainer.scrollLeft);
    const onScroll = () => setScrollLeft(scrollContainer.scrollLeft);
    scrollContainer.addEventListener("scroll", onScroll);
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [cell, table]);

  useLayoutEffect(() => {
    const columnTools = columnToolsRef.current;
    const tableElement = table?.current;
    if (!columnTools || !tableElement) return;
    if (!cell) {
      columnTools.style.display = "none";
      return;
    }
    columnTools.style.display = "flex";
    const shift = scrollAtMeasure.current - scrollLeft;
    const tableRect = tableElement.getBoundingClientRect();
    let cancelled = false;
    getPosition(columnTools, {
      location: "top",
      align: "center",
      // The cell's columns, over the table's full height.
      target: rectTarget(
        {
          left: cell.left + shift,
          right: cell.right + shift,
          top: tableRect.top,
          bottom: tableRect.bottom
        },
        tableElement
      ),
      yOffset: 2
    }).then(({ top, left }) => {
      if (cancelled) return;
      columnTools.style.left = `${left}px`;
      columnTools.style.top = `${top}px`;
    });
    return () => {
      cancelled = true;
    };
  }, [cell, scrollLeft, table]);

  return (
    <Flex
      ref={columnToolsRef}
      sx={{
        display: "none",
        zIndex: 999,
        top: 0,
        left: 0,
        position: "absolute",
        bg: "background",
        flexWrap: "nowrap",
        borderRadius: "default",
        border: "1px solid var(--border)",
        opacity: 0.4,
        ":hover": {
          opacity: 1
        }
      }}
    >
      <TableProperties
        editor={editor}
        title={strings.tableSettings()}
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
