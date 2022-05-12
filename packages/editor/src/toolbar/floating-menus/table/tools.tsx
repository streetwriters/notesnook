import { Theme } from "@notesnook/theme";
import { Slider } from "@rebass/forms";
import { Editor, findParentNodeClosestToPos } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import {
  ActionSheetPresenter,
  MenuPresenter,
  PopupPresenter,
} from "../../../components/menu/menu";
import {
  getElementPosition,
  MenuOptions,
} from "../../../components/menu/useMenu";
import { Popup } from "../../components/popup";
import { ToolButton, ToolButtonProps } from "../../components/tool-button";
import { IconNames } from "../../icons";
// import { ColorPicker, DEFAULT_COLORS } from "../tools/colors";
import { FloatingMenuProps } from "../types";
import { selectedRect, TableMap, TableRect } from "prosemirror-tables";
import { Transaction } from "prosemirror-state";
import { MenuItem } from "../../../components/menu/types";
import { DesktopOnly, MobileOnly } from "../../../components/responsive";
import { ToolProps } from "../../types";
import { CellProperties } from "../../popups/cell-properties";
import {
  moveColumnLeft,
  moveColumnRight,
  moveRowDown,
  moveRowUp,
} from "./actions";

type TableToolProps = ToolProps & { variant: ToolButtonProps["variant"] };

export function RowProperties(props: TableToolProps) {
  const { editor, ...toolProps } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <>
      <ToolButton
        toggled={isMenuOpen}
        {...toolProps}
        onClick={() => setIsMenuOpen(true)}
        // iconSize={16}
        //  sx={{ mr: 0, p: "3px", borderRadius: "small" }}
      />
      <MenuPresenter
        isOpen={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
          editor.commands.focus();
        }}
        options={{
          type: "menu",
          position: {},
        }}
        items={[
          {
            key: "addRowAbove",
            type: "menuitem",
            title: "Add row above",
            onClick: () => editor.chain().focus().addRowBefore().run(),
            icon: "insertRowAbove",
          },
          {
            key: "moveRowUp",
            type: "menuitem",
            title: "Move row up",
            onClick: () => moveRowUp(editor),
            icon: "moveRowUp",
          },
          {
            key: "moveRowDown",
            type: "menuitem",
            title: "Move row down",
            onClick: () => moveRowDown(editor),
            icon: "moveRowDown",
          },
          {
            key: "deleteRow",
            type: "menuitem",
            title: "Delete row",
            onClick: () => editor.chain().focus().deleteRow().run(),
            icon: "deleteRow",
          },
        ]}
      />
    </>
  );
}

export function InsertRowBelow(props: TableToolProps) {
  const { editor, ...toolProps } = props;
  return (
    <ToolButton
      toggled={false}
      {...toolProps}
      onClick={() => editor.chain().focus().addRowAfter().run()}
      // sx={{ mr: 0, p: "3px", borderRadius: "small" }}
      // iconSize={16}
    />
  );
}

type ColumnPropertiesProps = TableToolProps & {
  currentCell?: HTMLElement;
};
export function ColumnProperties(props: ColumnPropertiesProps) {
  const { editor, currentCell, ...toolProps } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isInsideCellSelection =
    !editor.state.selection.empty &&
    editor.state.selection.$anchor.node().type.name === "tableCell";

  const [showCellProps, setShowCellProps] = useState(false);
  const [menuPosition, setMenuPosition] = useState<
    MenuOptions["position"] | null
  >(null);

  const columnProperties: MenuItem[] = [
    {
      key: "addColumnLeft",
      type: "menuitem",
      title: "Add column left",
      onClick: () => editor.chain().focus().addColumnBefore().run(),
      icon: "insertColumnLeft",
    },
    {
      key: "addColumnRight",
      type: "menuitem",
      title: "Add column right",
      onClick: () => editor.chain().focus().addColumnAfter().run(),
      icon: "insertColumnRight",
    },
    {
      key: "moveColumnLeft",
      type: "menuitem",
      title: "Move column left",
      onClick: () => moveColumnLeft(editor),
      icon: "moveColumnLeft",
    },
    {
      key: "moveColumnRight",
      type: "menuitem",
      title: "Move column right",
      onClick: () => moveColumnRight(editor),
      icon: "moveColumnRight",
    },
    {
      key: "deleteColumn",
      type: "menuitem",
      title: "Delete column",
      onClick: () => editor.chain().focus().deleteColumn().run(),
      icon: "deleteColumn",
    },
  ];

  const mergeSplitProperties: MenuItem[] = [
    {
      key: "splitCells",
      type: "menuitem",
      title: "Split cells",
      onClick: () => editor.chain().focus().splitCell().run(),
      icon: "splitCells",
    },
    {
      key: "mergeCells",
      type: "menuitem",
      title: "Merge cells",
      onClick: () => editor.chain().focus().mergeCells().run(),
      icon: "mergeCells",
    },
  ];

  const cellProperties: MenuItem[] = [
    {
      key: "cellProperties",
      type: "menuitem",
      title: "Cell properties",
      onClick: () => {
        setShowCellProps(true);
        setMenuPosition({
          target: currentCell || undefined,
          isTargetAbsolute: true,
          yOffset: 10,
          location: "below",
        });
      },
      icon: "cellProperties",
    },
  ];

  const tableProperties: MenuItem[] = [
    {
      key: "deleteTable",
      type: "menuitem",
      title: "Delete table",
      icon: "deleteTable",
      onClick: () => editor.chain().focus().deleteTable().run(),
    },
  ];

  return (
    <>
      <ToolButton
        toggled={isMenuOpen}
        {...toolProps}
        onClick={async () => setIsMenuOpen(true)}
      />
      <PopupPresenter
        isOpen={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
          editor.commands.focus();
        }}
        mobile="sheet"
        items={
          isInsideCellSelection
            ? [...mergeSplitProperties, ...cellProperties]
            : [
                ...columnProperties,
                { type: "seperator", key: "cellSeperator" },
                ...cellProperties,
                { type: "seperator", key: "tableSeperator" },
                ...tableProperties,
              ]
        }
      />

      <PopupPresenter
        isOpen={showCellProps}
        onClose={() => {
          setShowCellProps(false);
          editor.commands.focus();
        }}
        options={{
          type: "menu",
          position: menuPosition || {},
        }}
        mobile="sheet"
      >
        <CellProperties
          editor={editor}
          onClose={() => setShowCellProps(false)}
        />
      </PopupPresenter>
    </>
  );
}

export function InsertColumnRight(props: TableToolProps) {
  const { editor, ...toolProps } = props;
  return (
    <ToolButton
      {...toolProps}
      toggled={false}
      onClick={() => editor.chain().focus().addColumnAfter().run()}
      // sx={{ mr: 0, p: "3px", borderRadius: "small" }}
      // iconSize={16}
    />
  );
}
