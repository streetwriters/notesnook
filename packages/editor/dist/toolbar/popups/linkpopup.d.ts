/// <reference types="react" />
export declare type LinkPopupProps = {
    text?: string;
    href?: string;
    isEditing?: boolean;
    onDone: (link: {
        text: string;
        href: string;
    }) => void;
    onClose: () => void;
};
export declare function LinkPopup(props: LinkPopupProps): JSX.Element;
