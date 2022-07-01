import { jsx as _jsx } from "react/jsx-runtime";
import { Dropdown } from "../components/dropdown";
import { useToolbarLocation } from "../stores/toolbar-store";
import { useMemo } from "react";
const defaultLevels = [1, 2, 3, 4, 5, 6];
export function Headings(props) {
    const { editor } = props;
    const toolbarLocation = useToolbarLocation();
    const currentHeadingLevel = defaultLevels.find((level) => editor.isActive("heading", { level }));
    const items = useMemo(() => toMenuItems(editor, toolbarLocation, currentHeadingLevel), [currentHeadingLevel]);
    return (_jsx(Dropdown, { selectedItem: currentHeadingLevel ? `Heading ${currentHeadingLevel}` : "Paragraph", items: items, menuWidth: 130 }));
}
function toMenuItems(editor, toolbarLocation, currentHeadingLevel) {
    const menuItems = defaultLevels.map((level) => ({
        type: "button",
        key: `heading-${level}`,
        title: toolbarLocation === "bottom" ? `H${level}` : `Heading ${level}`,
        isChecked: level === currentHeadingLevel,
        onClick: () => {
            var _a;
            return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().updateAttributes("textStyle", { fontSize: null, fontStyle: null }).setHeading({ level: level }).run();
        },
    }));
    const paragraph = {
        key: "paragraph",
        type: "button",
        title: "Paragraph",
        isChecked: !currentHeadingLevel,
        onClick: () => { var _a; return (_a = editor.current) === null || _a === void 0 ? void 0 : _a.chain().focus().setParagraph().run(); },
    };
    return [paragraph, ...menuItems];
}
