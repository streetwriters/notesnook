import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { Box, Button, Flex } from "rebass";
import { IconNames } from "../icons";
import { useRef, useState } from "react";
import { SplitButton } from "../components/split-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import { getToolbarElement } from "../utils/dom";
import { PopupWrapper } from "../../components/popup-presenter";

type ListSubType<TListStyleTypes> = {
  items: string[];
  title: string;
  type: TListStyleTypes;
};
type ListOptions<TListStyleTypes> = {
  icon: IconNames;
  type: "bulletList" | "orderedList";
  onClick: (editor: Editor) => void;
  subTypes: ListSubType<TListStyleTypes>[];
};

type ListToolProps<TListStyleTypes> = ToolProps & {
  options: ListOptions<TListStyleTypes>;
};
function ListTool<TListStyleTypes extends string>(
  props: ListToolProps<TListStyleTypes>
) {
  const { editor, options, ...toolProps } = props;
  const isActive = editor.isActive(options.type);
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>();

  return (
    <SplitButton
      {...toolProps}
      buttonRef={buttonRef}
      onClick={() => options.onClick(editor)}
      toggled={isActive || isOpen}
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
        renderPopup={() => (
          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", p: 1 }}
          >
            {options.subTypes.map((item) => (
              <Button
                key={item.title}
                variant={"menuitem"}
                sx={{ width: 80 }}
                onClick={() => {
                  let chain = editor.chain().focus();

                  if (!isActive) {
                    if (options.type === "bulletList")
                      chain = chain.toggleBulletList();
                    else chain = chain.toggleOrderedList();
                  }

                  return chain
                    .updateAttributes(options.type, { listType: item.type })
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

type NumberedListStyleTypes =
  | "lower-roman"
  | "upper-roman"
  | "lower-greek"
  | "lower-alpha"
  | "upper-alpha"
  | "decimal";

export function NumberedList(props: ToolProps) {
  const options: ListOptions<NumberedListStyleTypes> = {
    type: "orderedList",
    icon: "numberedList",
    onClick: (editor) => editor.chain().focus().toggleTaskList().run(),
    subTypes: [
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
    ],
  };
  return <ListTool {...props} options={options} />;
}

type BulletListStyleTypes = "circle" | "square" | "disc";
export function BulletList(props: ToolProps) {
  const options: ListOptions<BulletListStyleTypes> = {
    type: "bulletList",
    icon: "bulletList",
    onClick: (editor) => editor.chain().focus().toggleOrderedList().run(),
    subTypes: [
      { type: "disc", title: "Decimal", items: ["1", "2", "3"] },
      { type: "circle", title: "Upper alpha", items: ["A", "B", "C"] },
      { type: "square", title: "Lower alpha", items: ["a", "b", "c"] },
    ],
  };
  return <ListTool {...props} options={options} />;
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
