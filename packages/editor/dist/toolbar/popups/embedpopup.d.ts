/// <reference types="react" />
import { EmbedAlignmentOptions, EmbedAttributes, EmbedSizeOptions } from "../../extensions/embed";
import { IconNames } from "../icons";
declare type Embed = Required<EmbedAttributes> & EmbedAlignmentOptions;
export declare type EmbedPopupProps = {
    onClose: (embed: Embed) => void;
    title: string;
    icon: IconNames;
    embed?: Embed;
    onSizeChanged?: (size: EmbedSizeOptions) => void;
    onSourceChanged?: (src: string) => void;
};
export declare function EmbedPopup(props: EmbedPopupProps): JSX.Element;
export {};
