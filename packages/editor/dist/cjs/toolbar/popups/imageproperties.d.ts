/// <reference types="react" />
import { ImageAlignmentOptions, ImageSizeOptions } from "../../extensions/image";
import { Editor } from "../../types";
export declare type ImagePropertiesProps = ImageSizeOptions & ImageAlignmentOptions & {
    editor: Editor;
    onClose: () => void;
};
export declare function ImageProperties(props: ImagePropertiesProps): JSX.Element;
