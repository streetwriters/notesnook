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

import { ToolProps } from "../types.js";
import { Editor } from "../../types.js";
import { Dropdown } from "../components/dropdown.js";
import { MenuItem } from "@notesnook/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useToolbarStore,
  useToolbarLocation
} from "../stores/toolbar-store.js";
import { getFont, getFontById, getFonts } from "../../utils/font.js";
import { CodeBlock } from "../../extensions/code-block/index.js";
import { strings } from "@notesnook/intl";
import { Flex, Input } from "@theme-ui/components";
import { ToolButton } from "../components/tool-button.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { FONT_SIZE_BOUNDS } from "@notesnook/common";

const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 56, 64, 72, 80,
  96, 120
];

export function FontSize(props: ToolProps) {
  const { editor } = props;
  const defaultFontSize = useToolbarStore((store) => store.fontSize);
  const { fontSize } = editor.getAttributes("textStyle");
  const currentSize = fontSize
    ? parseInt(fontSize.replace("px", "")) || defaultFontSize
    : defaultFontSize;
  const disabled = editor.isActive(CodeBlock.name);
  const toolbarLocation = useToolbarLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyInputValue = useCallback(() => {
    if (!inputRef.current) return;

    const inputValue = inputRef.current.value.trim();
    const parsedValue = Number(inputValue);
    if (inputValue === "" || isNaN(parsedValue)) {
      inputRef.current.value = String(currentSize);
      return;
    }

    const clamped = Math.min(
      FONT_SIZE_BOUNDS.MAX,
      Math.max(FONT_SIZE_BOUNDS.MIN, parsedValue)
    );
    editor.chain().focus().setFontSize(`${clamped}px`).run();
  }, [editor, currentSize]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = String(currentSize);
  }, [currentSize]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      /**
       * close menu when clicking outside both the container and the popup
       */
      if (containerRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.(".popup-presenter")) return;

      setIsMenuOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isMenuOpen]);

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        key: "default",
        type: "button" as const,
        title: strings.default(),
        onClick: () => {
          editor.chain().focus().setFontSize(`${defaultFontSize}px`).run();
        },
        onKeyboardFocus: () => {
          if (!inputRef.current) return;
          inputRef.current.value = String(defaultFontSize);
        }
      },
      ...FONT_SIZES.map((size) => ({
        key: String(size),
        type: "button" as const,
        title: `${size}px`,
        onClick: () => {
          editor.chain().focus().setFontSize(`${size}px`).run();
        },
        onKeyboardFocus: () => {
          if (!inputRef.current) return;
          inputRef.current.value = String(size);
        }
      }))
    ],
    [editor, defaultFontSize]
  );

  return (
    <>
      <Flex
        ref={containerRef}
        sx={{
          alignItems: "stretch",
          borderRadius: "default",
          overflow: "hidden",
          height: "100%"
        }}
      >
        <ToolButton
          toggled={false}
          title={strings.decrease(strings.fontSize())}
          icon="minus"
          variant="small"
          disabled={disabled}
          onClick={
            disabled
              ? undefined
              : (e) => {
                  e.stopPropagation();
                  const current =
                    parseInt(inputRef.current?.value ?? "") || currentSize;
                  const newSize = Math.max(FONT_SIZE_BOUNDS.MIN, current - 1);
                  editor.chain().focus().setFontSize(`${newSize}px`).run();
                }
          }
        />

        <Input
          ref={inputRef}
          type="number"
          defaultValue={currentSize}
          disabled={disabled}
          title={disabled ? "" : strings.fontSize()}
          sx={{
            width: 40,
            fontSize: "subBody",
            fontFamily: "body",
            bg: "transparent",
            border: "none",
            outline: "none",
            textAlign: "center",
            color: "paragraph",
            marginTop: "2px",
            marginBottom: "2px",
            padding: 0,
            cursor: disabled ? "not-allowed" : "text",
            "::-moz-appearance": "textfield",
            "::-webkit-inner-spin-button": {
              "-webkit-appearance": "none"
            },
            "::-webkit-outer-spin-button": {
              "-webkit-appearance": "none"
            }
          }}
          onClick={() => setIsMenuOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              return;
            }

            if (!inputRef.current) return;

            if (e.key === "Enter") {
              applyInputValue();
              setIsMenuOpen(false);
            } else if (e.key === "Escape") {
              inputRef.current.value = String(currentSize);
              setIsMenuOpen(false);
            }
          }}
          onBlur={(e) => {
            if (
              (e.relatedTarget as HTMLElement)?.closest?.(".popup-presenter")
            ) {
              return;
            }

            applyInputValue();
            setIsMenuOpen(false);
          }}
        />

        <ToolButton
          toggled={false}
          title={strings.increase(strings.fontSize())}
          icon="plus"
          variant="small"
          disabled={disabled}
          onClick={
            disabled
              ? undefined
              : (e) => {
                  e.stopPropagation();
                  const current =
                    parseInt(inputRef.current?.value ?? "") || currentSize;
                  const newSize = Math.min(FONT_SIZE_BOUNDS.MAX, current + 1);
                  editor.chain().focus().setFontSize(`${newSize}px`).run();
                }
          }
        />
      </Flex>
      <ResponsivePresenter
        desktop="menu"
        mobile="sheet"
        title={strings.fontSize()}
        isOpen={isMenuOpen}
        items={menuItems}
        onClose={() => setIsMenuOpen(false)}
        focusOnRender={false}
        blocking={false}
        position={{
          target: containerRef.current || undefined,
          isTargetAbsolute: true,
          location: toolbarLocation === "bottom" ? "top" : "below",
          yOffset: 5
        }}
      />
    </>
  );
}

export function FontFamily(props: ToolProps) {
  const { editor } = props;
  const defaultFontFamily = useToolbarStore((store) => store.fontFamily);
  const currentFontFamily = editor.getAttributes("textStyle").fontFamily;
  const selectedFont = currentFontFamily
    ? getFont(currentFontFamily)
    : getFontById(defaultFontFamily);

  const items = useMemo(
    () => toMenuItems(editor, currentFontFamily),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentFontFamily]
  );

  return (
    <Dropdown
      id="fontFamily"
      group="font"
      selectedItem={selectedFont?.title || defaultFontFamily}
      items={items}
      menuWidth={130}
      disabled={editor.isActive(CodeBlock.name)}
    />
  );
}

function toMenuItems(editor: Editor, currentFontFamily: string): MenuItem[] {
  const menuItems: MenuItem[] = [];
  for (const font of getFonts()) {
    menuItems.push({
      key: font.id,
      type: "button",
      title: font.title,
      isChecked: font.id === currentFontFamily,
      onClick: () => editor.chain().focus().setFontFamily(font.id).run(),
      styles: {
        title: {
          fontFamily: font.font
        }
      }
    });
  }
  return menuItems;
}
