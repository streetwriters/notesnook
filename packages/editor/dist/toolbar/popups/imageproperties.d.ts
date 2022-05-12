/// <reference types="react" />
import { ImageAlignmentOptions, ImageSizeOptions } from "../../extensions/image";
import { Editor } from "@tiptap/core";
export declare type ImagePropertiesProps = ImageSizeOptions & ImageAlignmentOptions & {
    editor: Editor;
};
export declare function ImageProperties(props: ImagePropertiesProps): JSX.Element;
