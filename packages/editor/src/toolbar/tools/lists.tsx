import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolId } from ".";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";
import { Box, Button, Flex, Text } from "rebass";
import { Icon } from "../components/icon";
import { IconNames, Icons } from "../icons";
import { ToolButton } from "../components/tool-button";
import { MenuPresenter } from "../../components/menu/menu";
import { useRef, useState } from "react";

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
class ListTool<TListStyleTypes extends string> implements ITool {
  constructor(
    readonly id: ToolId,
    readonly title: string,
    private readonly options: ListOptions<TListStyleTypes>
  ) {}

  render = (props: ToolProps) => {
    const { editor } = props;
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const isActive = editor.isActive(this.options.type);

    return (
      <Flex ref={ref}>
        <ToolButton
          title={this.title}
          id={this.id}
          icon={this.options.icon}
          onClick={() => this.options.onClick(editor)}
          toggled={isActive}
          sx={{ mr: 0 }}
        />
        <Button
          sx={{
            p: 0,
            m: 0,
            bg: "transparent",
            ":hover": { bg: "hover" },
            ":last-of-type": {
              mr: 0,
            },
          }}
          onClick={() => setIsOpen((s) => !s)}
        >
          <Icon path={Icons.chevronDown} color="text" size={18} />
        </Button>
        <MenuPresenter
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={this.options.subTypes.map((item) => ({
            key: item.type,
            tooltip: item.title,
            type: "menuitem",
            component: () => <ListThumbnail listStyleType={item.type} />,
            onClick: () => {
              let chain = editor.chain().focus();

              if (!isActive) {
                if (this.options.type === "bulletList")
                  chain = chain.toggleBulletList();
                else chain = chain.toggleOrderedList();
              }

              return chain
                .updateAttributes(this.options.type, { listType: item.type })
                .run();
            },
          }))}
          sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", p: 1 }}
          options={{
            type: "menu",
            position: {
              target: ref.current || undefined,
              isTargetAbsolute: true,
              location: "below",
              yOffset: 5,
            },
          }}
        />
      </Flex>
    );
  };
}

type NumberedListStyleTypes =
  | "lower-roman"
  | "upper-roman"
  | "lower-greek"
  | "lower-alpha"
  | "upper-alpha"
  | "decimal";
export class NumberedList extends ListTool<NumberedListStyleTypes> {
  constructor() {
    const options: ListOptions<NumberedListStyleTypes> = {
      type: "orderedList",
      icon: "numberedList",
      onClick: (editor) => editor.chain().focus().toggleOrderedList().run(),
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
    super("numberedList", "Numbered list", options);
  }
}

type BulletListStyleTypes = "circle" | "square" | "disc";
export class BulletList extends ListTool<BulletListStyleTypes> {
  constructor() {
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
    super("bulletList", "Bullet list", options);
  }
}

export class Checklist implements ITool {
  id: ToolId = "checklist";
  title = "Checklist";

  render = (props: ToolProps) => {
    const { editor } = props;

    return (
      <ToolButton
        title={this.title}
        id={this.id}
        icon="checklist"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        toggled={false}
      />
    );
  };
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
      {[0, 0, 0].map(() => (
        <Box
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
                borderRadius: "2px",
              }}
            />
          </Flex>
        </Box>
      ))}
    </Flex>
  );
}
