import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { ToolId } from ".";
import { IconNames, Icons } from "../icons";
import { MenuPresenter } from "../../components/menu/menu";
import { useEffect, useRef, useState } from "react";
import { Dropdown } from "../components/dropdown";
import { Icon } from "../components/icon";
import { Box, Button, Flex, Text } from "rebass";
import { Popup } from "../components/popup";

class BlockTool<TId extends ToolId> implements ITool {
  constructor(
    readonly id: TId,
    readonly title: string,
    private readonly icon: IconNames,
    private readonly command: (editor: Editor) => boolean
  ) {}

  render = (props: ToolProps) => {
    const { editor } = props;

    return (
      <ToolButton
        id={this.id}
        title={this.title}
        icon={this.icon}
        onClick={() => this.command(editor)}
        toggled={editor.isActive(this.id)}
      />
    );
  };
}

export class HorizontalRule extends BlockTool<ToolId> {
  constructor() {
    super("horizontalRule", "Horizontal rule", "horizontalRule", (editor) =>
      editor.chain().focus().setHorizontalRule().run()
    );
  }
}

export class CodeBlock extends BlockTool<ToolId> {
  constructor() {
    super("codeblock", "Codeblock", "codeblock", (editor) =>
      editor.chain().focus().toggleCodeBlock().run()
    );
  }
}

export class Blockquote extends BlockTool<ToolId> {
  constructor() {
    super("blockquote", "Blockquote", "blockquote", (editor) =>
      editor.chain().focus().toggleBlockquote().run()
    );
  }
}

export class Image implements ITool {
  id: ToolId = "image";
  title: string = "Image";

  render = (props: ToolProps) => {
    const { editor } = props;
    return (
      <>
        <Dropdown
          selectedItem={<Icon path={Icons.image} size={16} />}
          items={[
            {
              key: "upload-from-disk",
              type: "menuitem",
              title: "Upload from disk",
              icon: "upload",
              onClick: () => {},
            },
            {
              key: "upload-from-url",
              type: "menuitem",
              title: "Attach from URL",
              icon: "link",
              onClick: () => {},
            },
          ]}
        />
      </>
    );
  };
}

type CellLocation = { column: number; row: number };
type TableSize = { columns: number; rows: number };
export class Table implements ITool {
  id: ToolId = "table";
  title: string = "Table";
  private MAX_COLUMNS = 20;
  private MAX_ROWS = 20;

  private MIN_COLUMNS = 4;
  private MIN_ROWS = 4;

  render = (props: ToolProps) => {
    const { editor } = props;
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [cellLocation, setCellLocation] = useState<CellLocation>({
      column: 0,
      row: 0,
    });
    const [tableSize, setTableSize] = useState<TableSize>({
      columns: this.MIN_COLUMNS,
      rows: this.MIN_ROWS,
    });

    useEffect(() => {
      setTableSize((old) => {
        const { columns, rows } = old;
        const { column, row } = cellLocation;

        let isDecrease = row === rows - 2 || column === columns - 2;

        let rowFactor = Number(row === rows || row === rows - 2);
        let columnFactor = Number(column === columns || column === columns - 2);

        return {
          columns: isDecrease
            ? Math.max(column + columnFactor, this.MIN_COLUMNS)
            : Math.min(old.columns + columnFactor, this.MAX_COLUMNS),
          rows: isDecrease
            ? Math.max(row + rowFactor, this.MIN_ROWS)
            : Math.min(old.rows + rowFactor, this.MAX_ROWS),
        };
      });
    }, [cellLocation]);

    return (
      <Flex ref={ref}>
        <Button
          sx={{
            p: 1,
            m: 0,
            bg: isOpen ? "hover" : "transparent",
            mr: 1,
            display: "flex",
            alignItems: "center",
            ":hover": { bg: "hover" },
            ":last-of-type": {
              mr: 0,
            },
          }}
          onClick={() => setIsOpen((s) => !s)}
        >
          <Icon path={Icons.table} color="text" size={18} />
          <Icon path={Icons.chevronDown} color="text" size={18} />
        </Button>
        <MenuPresenter
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={[]}
          options={{
            type: "menu",
            position: {
              target: ref.current || undefined,
              isTargetAbsolute: true,
              location: "below",
              yOffset: 5,
            },
          }}
        >
          <Popup>
            <Flex sx={{ p: 1, flexDirection: "column", alignItems: "center" }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr ".repeat(tableSize.columns),
                  gap: "3px",
                  bg: "background",
                }}
              >
                {Array(tableSize.columns * tableSize.rows)
                  .fill(0)
                  .map((_, index) => (
                    <Box
                      width={15}
                      height={15}
                      sx={{
                        border: "1px solid var(--disabled)",
                        borderRadius: "2px",
                        bg: this.isCellHighlighted(
                          index,
                          cellLocation,
                          tableSize
                        )
                          ? "disabled"
                          : "transparent",
                        ":hover": {
                          bg: "disabled",
                        },
                      }}
                      onMouseEnter={() => {
                        setCellLocation(this.getCellLocation(index, tableSize));
                      }}
                      onClick={() => {
                        editor
                          .chain()
                          .focus()
                          .insertTable({
                            cols: cellLocation.column,
                            rows: cellLocation.row,
                          })
                          .run();
                        setIsOpen(false);
                      }}
                    />
                  ))}
              </Box>
              <Text variant={"body"} sx={{ mt: 1 }}>
                {cellLocation.column}x{cellLocation.row}
              </Text>
            </Flex>
          </Popup>
        </MenuPresenter>
      </Flex>
    );
  };

  private getCellLocation(index: number, tableSize: TableSize): CellLocation {
    const cellIndex = index + 1;
    const column = cellIndex % tableSize.columns;
    let row = cellIndex / tableSize.columns;
    const flooredRow = Math.floor(row);
    row = row === flooredRow ? row : flooredRow + 1;

    return { column: column ? column : tableSize.columns, row };
  }

  private isCellHighlighted(
    index: number,
    currentCellLocation: CellLocation,
    tableSize: TableSize
  ) {
    const cellLocation = this.getCellLocation(index, tableSize);
    return (
      cellLocation.row <= currentCellLocation.row &&
      cellLocation.column <= currentCellLocation.column
    );
  }
}
