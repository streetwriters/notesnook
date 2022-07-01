import { jsx as _jsx } from "react/jsx-runtime";
import { SearchReplacePopup } from "../popups/search-replace";
import { ResponsivePresenter, } from "../../components/responsive";
import { getToolbarElement } from "../utils/dom";
export function SearchReplaceFloatingMenu(props) {
    const { editor } = props;
    const { isSearching } = editor.storage.searchreplace;
    return (_jsx(ResponsivePresenter, Object.assign({ mobile: "sheet", desktop: "menu", isOpen: isSearching, onClose: () => editor.commands.endSearch(), position: {
            target: getToolbarElement(),
            isTargetAbsolute: true,
            location: "below",
            align: "end",
            yOffset: 5,
        }, blocking: false, focusOnRender: false, draggable: false }, { children: _jsx(SearchReplacePopup, { editor: editor }) })));
}
