"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkPopup = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var forms_1 = require("@rebass/forms");
var react_1 = require("react");
var rebass_1 = require("rebass");
var popup_1 = require("../components/popup");
function LinkPopup(props) {
    var _text = props.text, _href = props.href, _a = props.isEditing, isEditing = _a === void 0 ? false : _a, onDone = props.onDone, onClose = props.onClose;
    var _b = __read((0, react_1.useState)(_href || ""), 2), href = _b[0], setHref = _b[1];
    var _c = __read((0, react_1.useState)(_text || ""), 2), text = _c[0], setText = _c[1];
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, __assign({ title: isEditing ? "Edit link" : "Insert link", onClose: onClose, action: {
            title: isEditing ? "Save edits" : "Insert link",
            onClick: function () { return onDone({ text: text, href: href }); },
        } }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { p: 1, flexDirection: "column", width: ["auto", 250] } }, { children: [(0, jsx_runtime_1.jsx)(forms_1.Input, { type: "text", placeholder: "Link text", value: text, onChange: function (e) { return setText(e.target.value); } }), (0, jsx_runtime_1.jsx)(forms_1.Input, { type: "url", sx: { mt: 1 }, autoFocus: true, placeholder: "https://example.com/", value: href, onChange: function (e) { return setHref(e.target.value); } })] })) })));
}
exports.LinkPopup = LinkPopup;
