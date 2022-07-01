"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Headings = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const dropdown_1 = require("../components/dropdown");
const toolbarstore_1 = require("../stores/toolbarstore");
const react_1 = require("react");
const defaultLevels = [1, 2, 3, 4, 5, 6];
function Headings(props) {
    const { editor } = props;
    const toolbarLocation = (0, toolbarstore_1.useToolbarLocation)();
    const currentHeadingLevel = defaultLevels.find((level) => editor.isActive("heading", { level }));
    const items = (0, react_1.useMemo)(() => toMenuItems(editor, toolbarLocation, currentHeadingLevel), [currentHeadingLevel]);
    return ((0, jsx_runtime_1.jsx)(dropdown_1.Dropdown, { selectedItem: currentHeadingLevel ? `Heading ${currentHeadingLevel}` : "Paragraph", items: items, menuWidth: 130 }));
}
exports.Headings = Headings;
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
