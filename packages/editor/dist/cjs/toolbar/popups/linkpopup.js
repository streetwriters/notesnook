"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkPopup = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const forms_1 = require("@rebass/forms");
const react_1 = require("react");
const rebass_1 = require("rebass");
const popup_1 = require("../components/popup");
function LinkPopup(props) {
    const { text: _text, href: _href, isEditing = false, onDone, onClose, } = props;
    const [href, setHref] = (0, react_1.useState)(_href || "");
    const [text, setText] = (0, react_1.useState)(_text || "");
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, Object.assign({ title: isEditing ? "Edit link" : "Insert link", onClose: onClose, action: {
            title: isEditing ? "Save edits" : "Insert link",
            onClick: () => onDone({ text, href }),
        } }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { p: 1, flexDirection: "column", width: ["auto", 250] } }, { children: [(0, jsx_runtime_1.jsx)(forms_1.Input, { type: "text", placeholder: "Link text", value: text, onChange: (e) => setText(e.target.value) }), (0, jsx_runtime_1.jsx)(forms_1.Input, { type: "url", sx: { mt: 1 }, autoFocus: true, placeholder: "https://example.com/", value: href, onChange: (e) => setHref(e.target.value) })] })) })));
}
exports.LinkPopup = LinkPopup;
