"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchReplaceFloatingMenu = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const searchreplace_1 = require("../popups/searchreplace");
const responsive_1 = require("../../components/responsive");
const dom_1 = require("../utils/dom");
function SearchReplaceFloatingMenu(props) {
    const { editor } = props;
    const { isSearching } = editor.storage.searchreplace;
    return ((0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, Object.assign({ mobile: "sheet", desktop: "menu", isOpen: isSearching, onClose: () => editor.commands.endSearch(), position: {
            target: (0, dom_1.getToolbarElement)(),
            isTargetAbsolute: true,
            location: "below",
            align: "end",
            yOffset: 5,
        }, blocking: false, focusOnRender: false, draggable: false }, { children: (0, jsx_runtime_1.jsx)(searchreplace_1.SearchReplacePopup, { editor: editor }) })));
}
exports.SearchReplaceFloatingMenu = SearchReplaceFloatingMenu;
