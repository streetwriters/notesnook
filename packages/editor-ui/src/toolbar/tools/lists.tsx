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

import { q } from "../../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../../queries/use-query.js";
import { ToolProps } from "../types.js";
import { Box, Button, Flex, Text, type UIElement } from "@ui";
import { IconNames } from "../icons.js";
import { useCallback, useRef } from "react";
import { SplitButton } from "../components/split-button.js";
import {
  toolbarRef,
  usePopupManager,
  useToolbarLocation
} from "../stores/toolbar-store.js";
import { PopupWrapper } from "../../components/popup-presenter/index.js";
import { ToolButton } from "../components/tool-button.js";
import type { EditorController } from "../../controller.js";
import { NODE_NAMES } from "../../extension-types.js";
import { strings } from "@notesnook/intl";

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

const BULLETS: Record<string, string> = {
  disc: "•",
  circle: "◦",
  square: "▪"
};

function ListTool<TListStyleTypes extends string>(
  props: ListToolProps<TListStyleTypes>
) {
  const { editor, onClick, subTypes, type, parentGroup, isActive } = props;
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";
  const buttonRef = useRef<UIElement>(null);
  const { toggle, isOpen, close } = usePopupManager({
    id: props.title,
    group: "lists",
    parent: parentGroup
  });

  return (
    <SplitButton
      icon={props.icon}
      title={props.title}
      buttonRef={buttonRef}
      onClick={onClick}
      toggled={isOpen}
      sx={{ mr: 0 }}
      onOpen={toggle}
    >
      <PopupWrapper
        group="lists"
        id={props.title}
        blocking={false}
        focusOnRender={false}
        autoCloseOnUnmount
        anchorRef={isBottom ? toolbarRef : buttonRef}
        placement={isBottom ? "top-start" : "bottom-start"}
      >
        <Flex
          sx={{
            flexDirection: "row",
            flexWrap: "wrap",
            width: 264,
            bg: "background",
            borderRadius: "default",
            p: 1
          }}
        >
          {subTypes.map((item) => (
            <Button
              key={item.title}
              testID={`list-type-${item.type}`}
              title={item.title}
              variant={"menuitem"}
              focusable={false}
              sx={{ width: 80, p: 0, m: "2px", borderRadius: "default" }}
              onPress={() => {
                close();
                editor.run(
                  ...(isActive
                    ? []
                    : [
                        {
                          name:
                            type === "bulletList"
                              ? "toggleBulletList"
                              : "toggleOrderedList"
                        }
                      ]),
                  { name: "updateAttributes", args: [type, { listType: item.type }] }
                );
              }}
            >
              <ListThumbnail
                markers={
                  type === "bulletList"
                    ? Array(3).fill(BULLETS[item.type] || "•")
                    : item.items
                }
              />
            </Button>
          ))}
        </Flex>
      </PopupWrapper>
    </SplitButton>
  );
}

export function NumberedList(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("orderedList"), false);

  const onClick = useCallback(
    () => editor.run({ name: "toggleOrderedList" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ListTool
      {...props}
      type="orderedList"
      isActive={isActive}
      onClick={onClick}
      subTypes={[
        { type: "decimal", title: strings.decimal(), items: ["1", "2", "3"] },
        {
          type: "upper-alpha",
          title: strings.upperAlpha(),
          items: ["A", "B", "C"]
        },
        {
          type: "lower-alpha",
          title: strings.lowerAlpha(),
          items: ["a", "b", "c"]
        },
        {
          type: "upper-roman",
          title: strings.upperRoman(),
          items: ["I", "II", "III"]
        },
        {
          type: "lower-roman",
          title: strings.lowerRoman(),
          items: ["i", "ii", "iii"]
        },
        {
          type: "lower-greek",
          title: strings.lowerGreek(),
          items: ["α", "β", "γ"]
        }
      ]}
    />
  );
}

export function BulletList(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("bulletList"), false);
  const onClick = useCallback(
    () => editor.run({ name: "toggleBulletList" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ListTool
      {...props}
      type="bulletList"
      onClick={onClick}
      isActive={isActive}
      subTypes={[
        { type: "disc", title: strings.disc(), items: ["1", "2", "3"] },
        { type: "circle", title: strings.circle(), items: ["A", "B", "C"] },
        { type: "square", title: strings.square(), items: ["a", "b", "c"] }
      ]}
    />
  );
}

export function CheckList(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={false}
      onClick={() => editor.run({ name: "toggleCheckList" })}
    />
  );
}

function useListItemType(editor: EditorController): string | null {
  const isTaskList = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.taskList),
    false
  );
  const isCheckList = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.checkList),
    false
  );
  const isOutlineList = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.outlineList),
    false
  );
  const isBulletList = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.bulletList),
    false
  );
  const isOrderedList = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.orderedList),
    false
  );
  return isBulletList || isOrderedList
    ? NODE_NAMES.listItem
    : isOutlineList
    ? NODE_NAMES.outlineListItem
    : isTaskList
    ? NODE_NAMES.taskItem
    : isCheckList
    ? NODE_NAMES.checkListItem
    : null;
}

export function Indent(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";

  const listItemType = useListItemType(editor);
  if (!listItemType || !isBottom) return null;

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={false}
      onClick={() => editor.run({ name: "sinkListItem", args: [listItemType] })}
    />
  );
}

export function Outdent(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";

  const listItemType = useListItemType(editor);
  if (!listItemType || !isBottom) return null;

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={false}
      onClick={() => editor.run({ name: "liftListItem", args: [listItemType] })}
    />
  );
}

function ListThumbnail(props: { markers: string[] }) {
  return (
    <Flex sx={{ flexDirection: "column", flex: 1, p: 1, gap: 1 }}>
      {props.markers.map((marker, i) => (
        <Flex
          key={i.toString()}
          sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}
        >
          <Text sx={{ fontSize: 8, color: "paragraph", width: 12 }}>
            {marker}
          </Text>
          <Box
            sx={{
              flex: 1,
              bg: "border",
              height: 7,
              borderRadius: "small"
            }}
          />
        </Flex>
      ))}
    </Flex>
  );
}
