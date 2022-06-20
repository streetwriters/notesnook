import { Node, ParentConfig } from "@tiptap/core";
import { NodeView } from "prosemirror-view";
export interface TableOptions {
    HTMLAttributes: Record<string, any>;
    resizable: boolean;
    handleWidth: number;
    cellMinWidth: number;
    View: NodeView;
    lastColumnResizable: boolean;
    allowTableNodeSelection: boolean;
}
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        table: {
            insertTable: (options?: {
                rows?: number;
                cols?: number;
                withHeaderRow?: boolean;
            }) => ReturnType;
            addColumnBefore: () => ReturnType;
            addColumnAfter: () => ReturnType;
            deleteColumn: () => ReturnType;
            addRowBefore: () => ReturnType;
            addRowAfter: () => ReturnType;
            deleteRow: () => ReturnType;
            deleteTable: () => ReturnType;
            mergeCells: () => ReturnType;
            splitCell: () => ReturnType;
            toggleHeaderColumn: () => ReturnType;
            toggleHeaderRow: () => ReturnType;
            toggleHeaderCell: () => ReturnType;
            mergeOrSplit: () => ReturnType;
            setCellAttribute: (name: string, value: any) => ReturnType;
            goToNextCell: () => ReturnType;
            goToPreviousCell: () => ReturnType;
            fixTables: () => ReturnType;
            setCellSelection: (position: {
                anchorCell: number;
                headCell?: number;
            }) => ReturnType;
        };
    }
    interface NodeConfig<Options, Storage> {
        /**
         * Table Role
         */
        tableRole?: string | ((this: {
            name: string;
            options: Options;
            storage: Storage;
            parent: ParentConfig<NodeConfig<Options>>["tableRole"];
        }) => string);
    }
}
export declare const Table: Node<TableOptions, any>;
