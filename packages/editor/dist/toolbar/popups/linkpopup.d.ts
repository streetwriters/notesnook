export declare type LinkPopupProps = {
    text?: string;
    href?: string;
    isEditing?: boolean;
    onDone: (link: {
        text: string;
        href: string;
    }) => void;
};
export declare function LinkPopup(props: LinkPopupProps): JSX.Element;
