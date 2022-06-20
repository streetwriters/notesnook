/// <reference types="react" />
import { ImageAttributes } from "../../extensions/image";
export declare type ImageUploadPopupProps = {
    onInsert: (image: ImageAttributes) => void;
    onClose: () => void;
};
export declare function ImageUploadPopup(props: ImageUploadPopupProps): JSX.Element;
