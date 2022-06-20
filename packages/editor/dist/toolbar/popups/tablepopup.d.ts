declare type TableSize = {
    columns: number;
    rows: number;
};
export declare type TablePopupProps = {
    onInsertTable: (size: TableSize) => void;
};
export declare function TablePopup(props: TablePopupProps): JSX.Element;
export {};
