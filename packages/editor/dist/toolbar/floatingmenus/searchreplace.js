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
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { PopupPresenter, } from "../../components/menu/menu";
import { SearchReplacePopup } from "../popups/search-replace";
export function SearchReplaceFloatingMenu(props) {
    var editor = props.editor;
    var isSearching = editor.storage.searchreplace.isSearching;
    if (!isSearching)
        return null;
    return (_jsx(_Fragment, { children: _jsx(PopupPresenter, __assign({ mobile: "sheet", desktop: "menu", isOpen: true, onClose: function () { return editor.commands.endSearch(); }, options: {
                type: "autocomplete",
                position: {
                    target: document.querySelector(".editor-toolbar") || "mouse",
                    isTargetAbsolute: true,
                    location: "below",
                    align: "end",
                },
            } }, { children: _jsx(SearchReplacePopup, { editor: editor }) })) }));
}
