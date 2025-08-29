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

import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { createEditor, h } from "../../../../test-utils";
import { ImageNode } from "../image";

const mockClipboardWrite = vi.fn();
const mockClipboardItem = vi.fn();

beforeEach(() => {
  mockClipboardWrite.mockReset();
  mockClipboardItem.mockReset();

  // @ts-expect-error supports is declared here
  global.ClipboardItem = mockClipboardItem;

  Object.defineProperty(navigator, "clipboard", {
    value: {
      write: mockClipboardWrite
    },
    writable: true
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("image copy functionality", () => {
  test("should copy image to clipboard when Ctrl+C is pressed on selected image", async () => {
    const testHash = "test-hash";
    const base64ImageData =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=";
    const mockImageData = "data:image/png;base64," + base64ImageData;
    const expectedBlob = new Blob([Buffer.from(base64ImageData, "base64")], {
      type: "image/png"
    });

    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      extensions: {
        image: ImageNode
      }
    });
    editor.storage.getAttachmentData = vi.fn().mockResolvedValue(mockImageData);
    editor.commands.insertImage({
      src: "test.png",
      hash: testHash,
      mime: "image/png",
      filename: "test.png"
    });
    const imagePos = editor.state.doc.resolve(1);
    editor.commands.setNodeSelection(imagePos.pos);

    expect(editor.isActive("image")).toBe(true);

    const keydownEvent = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    editor.view.dom.dispatchEvent(keydownEvent);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(editor.storage.getAttachmentData).toHaveBeenCalledWith({
      type: "image",
      hash: testHash
    });
    expect(mockClipboardItem).toHaveBeenCalledWith({
      "image/png": expectedBlob
    });
    const clipboardItemInstance = mockClipboardItem.mock.results[0].value;
    expect(mockClipboardWrite).toHaveBeenCalledWith([clipboardItemInstance]);
  });

  test("should not copy image if no hash or mime type is present", async () => {
    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      extensions: {
        image: ImageNode
      }
    });
    editor.commands.insertImage({
      src: "test.png",
      filename: "test.png"
    });
    const imagePos = editor.state.doc.resolve(1);
    editor.commands.setNodeSelection(imagePos.pos);

    expect(editor.isActive("image")).toBe(true);

    const keydownEvent = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    editor.view.dom.dispatchEvent(keydownEvent);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockClipboardWrite).not.toHaveBeenCalled();
    expect(mockClipboardItem).not.toHaveBeenCalled();
  });

  test("should log error when clipboard operations fail", async () => {
    const mockImageData =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    const editorElement = h("div");
    const { editor } = createEditor({
      element: editorElement,
      extensions: {
        image: ImageNode
      }
    });
    editor.storage.getAttachmentData = vi.fn().mockResolvedValue(mockImageData);
    mockClipboardWrite.mockRejectedValue(new Error("Clipboard error"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    editor.commands.insertImage({
      src: "test.png",
      hash: "test-hash",
      mime: "image/png",
      filename: "test.png"
    });
    const imagePos = editor.state.doc.resolve(1);
    editor.commands.setNodeSelection(imagePos.pos);

    expect(editor.isActive("image")).toBe(true);

    const keydownEvent = new KeyboardEvent("keydown", {
      key: "c",
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    editor.view.dom.dispatchEvent(keydownEvent);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to copy image to clipboard:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});
