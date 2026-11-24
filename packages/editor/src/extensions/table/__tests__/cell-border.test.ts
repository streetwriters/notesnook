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
import { closeHistory } from "@tiptap/pm/history";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TableRow from "@tiptap/extension-table-row";
import { describe, expect, test, vi } from "vitest";
import TableCell from "../../table-cell/index.js";
import TableHeader from "../../table-header/index.js";

import { Table } from "../index.js";
import { CellSelection } from "../prosemirror-tables/cellselection.js";

function createEditor(style: string) {
  const editor = new Editor({
    extensions: [StarterKit, Table, TableRow, TableCell, TableHeader],
    content: `<table><tbody><tr><td style="${style}"><p>Excel cell</p></td></tr></tbody></table>`
  });
  editor.commands.setTextSelection(4);
  return editor;
}

describe("cell border color", () => {
  test("makes an imported borderless cell visible when choosing a border color", () => {
    const editor = createEditor("border: none");
    try {
      expect(
        editor.state.doc.firstChild?.firstChild?.firstChild?.attrs.borderStyle
      ).toBe("none");
      editor.commands.setCellAttribute("borderColor", "#ff0000");
      const cell = editor.state.doc.firstChild?.firstChild?.firstChild;
      expect(cell?.attrs.borderColor).toBe("#ff0000");
      expect(cell?.attrs.borderStyle).toBe("solid");
    } finally {
      editor.destroy();
    }
  });
  test.each(["none", "hidden"])(
    "restores %s borders without changing their width",
    (style) => {
      const editor = createEditor(`border-style: ${style}; border-width: 3px`);
      try {
        editor.commands.setCellAttribute("borderColor", "#ff0000");
        const attrs =
          editor.state.doc.firstChild?.firstChild?.firstChild?.attrs;
        expect(attrs.borderStyle).toBe("solid");
        expect(attrs.borderWidth).toBe("3");
      } finally {
        editor.destroy();
      }
    }
  );

  test("restores a zero-width border and preserves a dashed style", () => {
    const editor = createEditor("border-style: dashed; border-width: 0px");
    try {
      editor.commands.setCellAttribute("borderColor", "#ff0000");
      const attrs = editor.state.doc.firstChild?.firstChild?.firstChild?.attrs;
      expect(attrs.borderStyle).toBe("dashed");
      expect(attrs.borderWidth).toBe(1);
    } finally {
      editor.destroy();
    }
  });

  test("preserves visible custom borders", () => {
    const editor = createEditor("border: 3px dashed blue");
    try {
      editor.commands.setCellAttribute("borderColor", "#ff0000");
      const attrs = editor.state.doc.firstChild?.firstChild?.firstChild?.attrs;
      expect(attrs.borderStyle).toBe("dashed");
      expect(attrs.borderWidth).toBe("3");
    } finally {
      editor.destroy();
    }
  });

  test("clearing a color does not reveal hidden borders", () => {
    const editor = createEditor("border-style: none; border-color: red");
    try {
      editor.commands.setCellAttribute("borderColor", undefined);
      const attrs = editor.state.doc.firstChild?.firstChild?.firstChild?.attrs;
      expect(attrs.borderStyle).toBe("none");
      expect(attrs.borderColor).toBeNull();
    } finally {
      editor.destroy();
    }
  });

  test("reselecting the same color still reveals a hidden border", () => {
    const editor = createEditor("border-style: none; border-color: red");
    try {
      const color =
        editor.state.doc.firstChild?.firstChild?.firstChild?.attrs.borderColor;
      editor.commands.setCellAttribute("borderColor", color);
      expect(
        editor.state.doc.firstChild?.firstChild?.firstChild?.attrs.borderStyle
      ).toBe("solid");
    } finally {
      editor.destroy();
    }
  });

  test("updates a mixed selection even if the anchor already has the chosen color", () => {
    const editor = createEditor("");
    try {
      editor.commands.setContent(
        '<table><tbody><tr><td style="border: 3px dashed red"><p>A</p></td><th style="border-style: none; border-color: blue"><p>B</p></th></tr></tbody></table>'
      );
      const positions: number[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (
          node.type.spec.tableRole === "cell" ||
          node.type.spec.tableRole === "header_cell"
        )
          positions.push(pos);
      });
      editor.view.dispatch(
        editor.state.tr.setSelection(
          CellSelection.create(editor.state.doc, positions[0], positions[1])
        )
      );
      editor.view.dispatch(closeHistory(editor.state.tr));
      const original = editor.getJSON();
      const color = editor.state.doc.nodeAt(positions[0])?.attrs.borderColor;
      const dispatch = vi.spyOn(editor.view, "dispatch");
      expect(editor.can().setCellAttribute("borderColor", color)).toBe(true);
      expect(editor.getJSON()).toEqual(original);
      expect(dispatch).not.toHaveBeenCalled();
      editor.commands.setCellAttribute("borderColor", color);
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(editor.state.doc.nodeAt(positions[0])?.attrs.borderStyle).toBe(
        "dashed"
      );
      expect(editor.state.doc.nodeAt(positions[0])?.attrs.borderWidth).toBe(
        "3"
      );
      expect(editor.state.doc.nodeAt(positions[1])?.attrs.borderStyle).toBe(
        "solid"
      );
      expect(editor.state.doc.nodeAt(positions[1])?.attrs.borderColor).toBe(
        color
      );
      editor.commands.undo();
      expect(editor.getJSON()).toEqual(original);
    } finally {
      editor.destroy();
    }
  });

  test("retains repaired borders after HTML serialization", () => {
    const editor = createEditor("border-style: none; border-width: 0px");
    try {
      editor.commands.setCellAttribute("borderColor", "red");
      editor.commands.setContent(editor.getHTML());
      const attrs = editor.state.doc.firstChild?.firstChild?.firstChild?.attrs;
      expect(attrs.borderStyle).toBe("solid");
      expect(attrs.borderWidth).toBe("1");
      expect(attrs.borderColor).toBe("red");
    } finally {
      editor.destroy();
    }
  });
});
