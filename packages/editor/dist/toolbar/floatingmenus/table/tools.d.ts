import { ToolButtonProps } from "../../components/tool-button";
import { ToolProps } from "../../types";
declare type TableToolProps = ToolProps & {
    variant: ToolButtonProps["variant"];
};
export declare function RowProperties(props: TableToolProps): JSX.Element;
export declare function InsertRowBelow(props: TableToolProps): JSX.Element;
declare type ColumnPropertiesProps = TableToolProps & {
    currentCell?: HTMLElement;
};
export declare function ColumnProperties(props: ColumnPropertiesProps): JSX.Element;
export declare function InsertColumnRight(props: TableToolProps): JSX.Element;
export {};
