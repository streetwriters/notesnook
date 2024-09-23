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
import { Box, Button, Flex } from "@theme-ui/components";
import { IconNames } from "../icons.js";
import { useCallback, useRef } from "react";
import { SplitButton } from "../components/split-button.js";
import { usePopupManager, useToolbarLocation } from "../stores/toolbar-store.js";
import { getToolbarElement } from "../utils/dom.js";
import { PopupWrapper } from "../../components/popup-presenter/index.js";
import { ToolButton } from "../components/tool-button.js";
import { findListItemType, isListActive } from "../../utils/list.js";

type ListSubType<TListStyleTypes> = {
  items: string[];
  title: string;
  type: TListStyleTypes;
};

type ListToolProps<TListStyleTypes> = ToolProps & {
  isActive: boolean;
  icon: IconNames;
  type: "bulletList" | "orderedList";
  onClick: () => void;
  subTypes: ListSubType<TListStyleTypes>[];
};

function ListTool<TListStyleTypes extends string>(
  props: ListToolProps<TListStyleTypes>
) {
  const { editor, onClick, subTypes, type, parentGroup, ...toolProps } = props;
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { toggle, isOpen, close } = usePopupManager({
    id: toolProps.title,
    group: "lists",
    parent: parentGroup
  });

  return (
    <SplitButton
      {...toolProps}
      buttonRef={buttonRef}
      onClick={onClick}
      toggled={isOpen}
      sx={{ mr: 0 }}
      onOpen={toggle}
    >
      <PopupWrapper
        group="lists"
        id={toolProps.title}
        blocking={false}
        focusOnRender={false}
        autoCloseOnUnmount
        position={{
          isTargetAbsolute: true,
          target: isBottom ? getToolbarElement() : buttonRef.current || "mouse",
          align: "center",
          location: isBottom ? "top" : "below",
          yOffset: 10
        }}
      >
        <Box
          sx={{
            bg: "background",
            boxShadow: "menu",
            borderRadius: "default",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            p: 1
          }}
        >
          {subTypes.map((item) => (
            <Button
              key={item.title}
              variant={"menuitem"}
              sx={{ width: 80, p: 0, borderRadius: "default" }}
              onClick={() => {
                let chain = editor.chain().focus();
                if (!chain || !editor) return;

                if (!isListActive(editor)) {
                  if (type === "bulletList") chain = chain.toggleBulletList();
                  else chain = chain.toggleOrderedList();
                }
                close();
                return chain
                  .updateAttributes(type, { listType: item.type })
                  .run();
              }}
            >
              <ListThumbnail listStyleType={item.type} />
            </Button>
          ))}
        </Box>
      </PopupWrapper>
    </SplitButton>
  );
}

export function NumberedList(props: ToolProps) {
  const { editor } = props;

  const onClick = useCallback(
    () => editor.chain().focus().toggleOrderedList().run(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ListTool
      {...props}
      type="orderedList"
      isActive={editor.isActive("orderedList")}
      onClick={onClick}
      subTypes={[
        { type: "decimal", title: "Decimal", items: ["1", "2", "3"] },
        { type: "upper-alpha", title: "Upper alpha", items: ["A", "B", "C"] },
        { type: "lower-alpha", title: "Lower alpha", items: ["a", "b", "c"] },
        {
          type: "upper-roman",
          title: "Upper Roman",
          items: ["I", "II", "III"]
        },
        {
          type: "lower-roman",
          title: "Lower Roman",
          items: ["i", "ii", "iii"]
        },
        { type: "lower-greek", title: "Lower Greek", items: ["α", "β", "γ"] }
      ]}
    />
  );
}

export function BulletList(props: ToolProps) {
  const { editor } = props;
  const onClick = useCallback(
    () => editor.chain().focus().toggleBulletList().run(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ListTool
      {...props}
      type="bulletList"
      onClick={onClick}
      isActive={editor.isActive("bulletList")}
      subTypes={[
        { type: "disc", title: "Decimal", items: ["1", "2", "3"] },
        { type: "circle", title: "Upper alpha", items: ["A", "B", "C"] },
        { type: "square", title: "Lower alpha", items: ["a", "b", "c"] }
      ]}
    />
  );
}

export function CheckList(props: ToolProps) {
  const { editor, ...toolProps } = props;

  return (
    <ToolButton
      {...toolProps}
      toggled={false}
      onClick={() => editor.chain().focus().toggleCheckList().run()}
    />
  );
}

export function Indent(props: ToolProps) {
  const { editor, ...toolProps } = props;
  const isBottom = useToolbarLocation() === "bottom";

  const listItemType = findListItemType(editor);
  if (!listItemType || !isBottom) return null;

  return (
    <ToolButton
      {...toolProps}
      toggled={false}
      onClick={() => editor.chain().focus().sinkListItem(listItemType).run()}
    />
  );
}

export function Outdent(props: ToolProps) {
  const { editor, ...toolProps } = props;
  const isBottom = useToolbarLocation() === "bottom";

  const listItemType = findListItemType(editor);
  if (!listItemType || !isBottom) return null;

  return (
    <ToolButton
      {...toolProps}
      toggled={false}
      onClick={() => editor.chain().focus().liftListItem(listItemType).run()}
    />
  );
}

type ListThumbnailProps = { listStyleType: string };
function ListThumbnail(props: ListThumbnailProps) {
  const { listStyleType } = props;
  return (
    <Flex
      as="ul"
      sx={{
        flexDirection: "column",
        flex: 1,
        listStyleType,
        m: 0,
        ml: "10px",
        p: "5px",
        pl: "7px",
        gap: `7px`
      }}
      onMouseDown={(e) => {
        if (globalThis.keyboardShown) {
          e.preventDefault();
        }
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i.toString()}
          as="li"
          sx={{
            display: "list-item",
            color: "paragraph",
            fontSize: 8,
            bg: "border",
            height: `7px`,
            borderRadius: "small"
          }}
        />
      ))}
    </Flex>
  );
}
