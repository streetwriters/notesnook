var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@rebass/forms";
import { useState } from "react";
import { Flex, Text } from "rebass";
import { Popup } from "../components/popup";
export function ImageUploadPopup(props) {
    const { onInsert, onClose } = props;
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState();
    const [url, setUrl] = useState("");
    return (_jsx(Popup, Object.assign({ title: "Insert image from URL", onClose: onClose, action: {
            loading: isDownloading,
            title: "Insert image",
            disabled: !url,
            onClick: () => __awaiter(this, void 0, void 0, function* () {
                setIsDownloading(true);
                setError(undefined);
                try {
                    const response = yield fetch(url);
                    if (!response.ok)
                        return setError(`invalid status code ${response.status}`);
                    const contentType = response.headers.get("Content-Type");
                    const contentLength = response.headers.get("Content-Length");
                    if (!contentType ||
                        !contentLength ||
                        contentLength === "0" ||
                        !contentType.startsWith("image/"))
                        return setError("not an image");
                    const size = parseInt(contentLength);
                    const dataurl = yield toDataURL(yield response.blob());
                    onInsert({ src: dataurl, type: contentType, size });
                }
                catch (e) {
                    if (e instanceof Error)
                        setError(e.message);
                }
                finally {
                    setIsDownloading(false);
                }
            }),
        } }, { children: _jsxs(Flex, Object.assign({ sx: { px: 1, flexDirection: "column", width: ["auto", 350] } }, { children: [_jsx(Input, { type: "url", autoFocus: true, placeholder: "Paste Image URL here", value: url, onChange: (e) => {
                        setUrl(e.target.value);
                        setError(undefined);
                    } }), error ? (_jsxs(Text, Object.assign({ variant: "error", sx: {
                        bg: "errorBg",
                        mt: 1,
                        p: 1,
                        borderRadius: "default",
                    } }, { children: ["Failed to download image: ", error.toLowerCase(), "."] }))) : (_jsx(Text, Object.assign({ variant: "subBody", sx: {
                        bg: "shade",
                        color: "primary",
                        mt: 1,
                        p: 1,
                        borderRadius: "default",
                    } }, { children: "To protect your privacy, we will download the image & add it to your attachments." })))] })) })));
}
function toDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (_e) => resolve(reader.result);
        reader.onerror = (_e) => reject(reader.error);
        reader.onabort = (_e) => reject(new Error("Read aborted"));
        reader.readAsDataURL(blob);
    });
}
