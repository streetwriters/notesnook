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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchReplaceFloatingMenu = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var searchreplace_1 = require("../popups/searchreplace");
var responsive_1 = require("../../components/responsive");
var dom_1 = require("../utils/dom");
function SearchReplaceFloatingMenu(props) {
    var editor = props.editor;
    var isSearching = editor.storage.searchreplace.isSearching;
    return ((0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, __assign({ mobile: "sheet", desktop: "menu", isOpen: isSearching, onClose: function () { return editor.commands.endSearch(); }, position: {
            target: (0, dom_1.getToolbarElement)(),
            isTargetAbsolute: true,
            location: "below",
            align: "end",
            yOffset: 5,
        }, blocking: false, focusOnRender: false, draggable: false }, { children: (0, jsx_runtime_1.jsx)(searchreplace_1.SearchReplacePopup, { editor: editor }) })));
}
exports.SearchReplaceFloatingMenu = SearchReplaceFloatingMenu;
