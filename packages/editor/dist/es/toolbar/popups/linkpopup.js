import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@rebass/forms";
import { useState } from "react";
import { Flex } from "rebass";
import { Popup } from "../components/popup";
export function LinkPopup(props) {
    const { text: _text, href: _href, isEditing = false, onDone, onClose, } = props;
    const [href, setHref] = useState(_href || "");
    const [text, setText] = useState(_text || "");
    return (_jsx(Popup, Object.assign({ title: isEditing ? "Edit link" : "Insert link", onClose: onClose, action: {
            title: isEditing ? "Save edits" : "Insert link",
            onClick: () => onDone({ text, href }),
        } }, { children: _jsxs(Flex, Object.assign({ sx: { p: 1, flexDirection: "column", width: ["auto", 250] } }, { children: [_jsx(Input, { type: "text", placeholder: "Link text", value: text, onChange: (e) => setText(e.target.value) }), _jsx(Input, { type: "url", sx: { mt: 1 }, autoFocus: true, placeholder: "https://example.com/", value: href, onChange: (e) => setHref(e.target.value) })] })) })));
}
