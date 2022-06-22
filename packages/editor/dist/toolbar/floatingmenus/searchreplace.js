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
import { jsx as _jsx } from "react/jsx-runtime";
import { SearchReplacePopup } from "../popups/search-replace";
import { ResponsivePresenter, } from "../../components/responsive";
import { getToolbarElement } from "../utils/dom";
export function SearchReplaceFloatingMenu(props) {
    var editor = props.editor;
    var isSearching = editor.storage.searchreplace.isSearching;
    return (_jsx(ResponsivePresenter, __assign({ mobile: "sheet", desktop: "menu", isOpen: isSearching, onClose: function () { return editor.commands.endSearch(); }, position: {
            target: getToolbarElement(),
            isTargetAbsolute: true,
            location: "below",
            align: "end",
            yOffset: 5,
        }, blocking: false, focusOnRender: false, draggable: false }, { children: _jsx(SearchReplacePopup, { editor: editor }) })));
}
