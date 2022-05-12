/// <reference types="react" />
declare type TableSize = {
    columns: number;
    rows: number;
};
export declare type TablePopupProps = {
    onInsertTable: (size: TableSize) => void;
    cellSize?: number;
    autoExpand?: boolean;
};
export declare function TablePopup(props: TablePopupProps): JSX.Element;
export {};
