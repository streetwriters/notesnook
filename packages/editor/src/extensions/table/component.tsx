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
import { Editor } from "../../types.js";
import { Editor as TiptapEditor } from "@tiptap/core";
import { useEffect, useRef } from "react";
import { updateColumnsOnResize } from "@tiptap/pm/tables";
import { EditorView, NodeView } from "prosemirror-view";
import {
  InsertColumnRight,
  InsertRowBelow,
  RowProperties,
  TableProperties
} from "../../toolbar/tools/table.js";
import { getToolDefinition } from "../../toolbar/tool-definitions.js";
import { getPosition } from "@notesnook/ui";
import {
  findSelectedDOMNode,
  hasSameAttributes
} from "../../utils/prosemirror.js";
import { DesktopOnly } from "../../components/responsive/index.js";
import { TextDirections } from "../text-direction/index.js";
import { strings } from "@notesnook/intl";

export function TableComponent(props: ReactNodeViewProps) {
  const { editor, node, forwardRef } = props;
  const colgroupRef = useRef<HTMLTableColElement>(null);
  const tableRef = useRef<HTMLTableElement>();
  const { textDirection } = node.attrs;

  useEffect(() => {
    if (!colgroupRef.current || !tableRef.current) return;

    updateColumnsOnResize(node, colgroupRef.current, tableRef.current, 50);
  }, [node]);

  return (
    <>
      <DesktopOnly>
        <TableRowToolbar
          editor={editor}
          table={tableRef}
          textDirection={textDirection}
        />
        <TableColumnToolbar
          editor={editor}
          table={tableRef}
          textDirection={textDirection}
        />
      </DesktopOnly>
      <div className="tableWrapper" dir={textDirection}>
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
    extends ReactNodeView<ReactNodeViewProps<unknown>>
    implements NodeView
  {
    constructor(node: ProsemirrorNode) {
      super(
        node,
        editor,
        () => 0, // todo
        {
          component: TableComponent,
          shouldUpdate: (prev, next) => {
            return (
              !hasSameAttributes(prev.attrs, next.attrs) ||
              prev.childCount !== next.childCount
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
  editor: Editor;
  table?: React.MutableRefObject<HTMLTableElement | undefined>;
  textDirection: TextDirections;
};

function TableRowToolbar(props: TableToolbarProps) {
  const { editor, textDirection, table } = props;
  const rowToolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onSelectionUpdate() {
      if (!rowToolsRef.current || !table?.current) {
        return;
      }

      const currentRow = findSelectedDOMNode(editor, ["tableRow"]);
      if (!currentRow || !table.current.contains(currentRow)) {
        rowToolsRef.current.style.display = "none";
        return;
      }
      rowToolsRef.current.style.display = "flex";

      const pos = getPosition(rowToolsRef.current, {
        location: "left",
        target: currentRow,
        align: "start",
        xOffset: -5,
        yOffset: -3
      });

      rowToolsRef.current.style.top = `${pos.top}px`;
      if (textDirection) {
        rowToolsRef.current.style.right = `${pos.left}px`;
        rowToolsRef.current.style.left = `unset`;
      } else {
        rowToolsRef.current.style.left = `${pos.left}px`;
        rowToolsRef.current.style.right = `unset`;
      }
    }

    editor.on("selectionUpdate", onSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
    };
  }, [textDirection]);

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
        flexDirection: "column",
        opacity: 0.3,
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

  useEffect(() => {
    function onSelectionUpdate() {
      if (!columnToolsRef.current || !table?.current) {
        return;
      }

      const currentCell = findSelectedDOMNode(editor, [
        "tableCell",
        "tableHeader"
      ]);
      if (!currentCell || !table.current.contains(currentCell)) {
        columnToolsRef.current.style.display = `none`;
        return;
      }
      columnToolsRef.current.style.display = "flex";

      // tableRef.current
      const pos = getPosition(columnToolsRef.current, {
        location: "top",
        align: "center",
        target: currentCell as HTMLElement,
        yAnchor: table.current,
        yOffset: 2
      });

      columnToolsRef.current.style.left = `${
        pos.left - (table.current.parentElement?.scrollLeft || 0)
      }px`;
      columnToolsRef.current.style.top = `${pos.top}px`;
    }

    editor.on("selectionUpdate", onSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
    };
  }, []);

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
        opacity: 0.3,
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
