/// <reference types="react" />
import { Embed, EmbedSizeOptions } from "../../extensions/embed";
export declare type EmbedPopupProps = {
    onClose: (embed?: Embed) => void;
    title?: string;
    embed?: Embed;
    onSizeChanged?: (size: EmbedSizeOptions) => void;
    onSourceChanged?: (src: string) => void;
};
export declare function EmbedPopup(props: EmbedPopupProps): JSX.Element;
