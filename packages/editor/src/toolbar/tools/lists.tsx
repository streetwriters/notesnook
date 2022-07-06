import { ToolProps } from "../types";
import { Box, Button, Flex } from "rebass";
import { IconNames } from "../icons";
import { useCallback, useMemo, useRef, useState } from "react";
import { SplitButton } from "../components/split-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
import { PopupWrapper } from "../../components/popup-presenter";
import React from "react";
import { ToolButton } from "../components/tool-button";
import { findListItemType, isListActive } from "../utils/prosemirror";

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

function _ListTool<TListStyleTypes extends string>(
  props: ListToolProps<TListStyleTypes>
) {
  const { editor, onClick, isActive, subTypes, type, ...toolProps } = props;
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>();

  return (
    <SplitButton
      {...toolProps}
      buttonRef={buttonRef}
      onClick={onClick}
      toggled={isOpen}
      sx={{ mr: 0 }}
      onOpen={() => setIsOpen((s) => !s)}
    >
      <PopupWrapper
        isOpen={isOpen}
        group="lists"
        id={toolProps.title}
        blocking={false}
        focusOnRender={false}
        position={{
          isTargetAbsolute: true,
          target: isBottom ? getToolbarElement() : buttonRef.current || "mouse",
          align: "center",
          location: isBottom ? "top" : "below",
          yOffset: isBottom ? 10 : 5,
        }}
        onClosed={() => setIsOpen(false)}
        renderPopup={() => (
          <Box
            sx={{
              bg: "background",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              p: 1,
            }}
          >
            {subTypes.map((item) => (
              <Button
                key={item.title}
                variant={"menuitem"}
                sx={{ width: 80 }}
                onClick={() => {
                  let chain = editor.current?.chain().focus();
                  if (!chain || !editor.current) return;

                  if (!isListActive(editor.current)) {
                    if (type === "bulletList") chain = chain.toggleBulletList();
                    else chain = chain.toggleOrderedList();
                  }

                  return chain
                    .updateAttributes(type, { listType: item.type })
                    .run();
                }}
              >
                <ListThumbnail listStyleType={item.type} />
              </Button>
            ))}
          </Box>
        )}
      />
    </SplitButton>
  );
}

const ListTool = React.memo(_ListTool, (prev, next) => {
  return prev.isActive === next.isActive;
});

type NumberedListStyleTypes =
  | "lower-roman"
  | "upper-roman"
  | "lower-greek"
  | "lower-alpha"
  | "upper-alpha"
  | "decimal";

export function NumberedList(props: ToolProps) {
  const { editor } = props;

  const onClick = useCallback(
    () => editor.current?.chain().focus().toggleOrderedList().run(),
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
          items: ["I", "II", "III"],
        },
        {
          type: "lower-roman",
          title: "Lower Roman",
          items: ["i", "ii", "iii"],
        },
        { type: "lower-greek", title: "Lower Greek", items: ["α", "β", "γ"] },
      ]}
    />
  );
}

type BulletListStyleTypes = "circle" | "square" | "disc";
export function BulletList(props: ToolProps) {
  const { editor } = props;
  const onClick = useCallback(
    () => editor.current?.chain().focus().toggleBulletList().run(),
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
        { type: "square", title: "Lower alpha", items: ["a", "b", "c"] },
      ]}
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
      onClick={() =>
        editor.current?.chain().focus().sinkListItem(listItemType).run()
      }
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
      onClick={() =>
        editor.current?.chain().focus().liftListItem(listItemType).run()
      }
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
        p: 0,
        listStyleType,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i.toString()}
          as="li"
          sx={{
            display: "list-item",
            color: "text",
            fontSize: 8,
            mb: "1px",
          }}
        >
          <Flex
            sx={{
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: "100%",
                flexShrink: 0,
                height: 4,
                bg: "#cbcbcb",
                borderRadius: "small",
              }}
            />
          </Flex>
        </Box>
      ))}
    </Flex>
  );
}
