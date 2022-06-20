/// <reference types="react" />
import { EmbedAlignmentOptions, EmbedAttributes, EmbedSizeOptions } from "../../extensions/embed";
declare type Embed = Required<EmbedAttributes> & EmbedAlignmentOptions;
export declare type EmbedPopupProps = {
    onClose: (embed?: Embed) => void;
    title?: string;
    embed?: Embed;
    onSizeChanged?: (size: EmbedSizeOptions) => void;
    onSourceChanged?: (src: string) => void;
};
export declare function EmbedPopup(props: EmbedPopupProps): JSX.Element;
export {};
