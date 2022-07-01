"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchReplacePopup = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const forms_1 = require("@rebass/forms");
const react_1 = require("react");
const rebass_1 = require("rebass");
const toolbutton_1 = require("../components/toolbutton");
function SearchReplacePopup(props) {
    const { editor } = props;
    const { selectedText, results } = editor.storage
        .searchreplace;
    const [isReplacing, setIsReplacing] = (0, react_1.useState)(false);
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(false);
    const [matchCase, setMatchCase] = (0, react_1.useState)(false);
    const [matchWholeWord, setMatchWholeWord] = (0, react_1.useState)(false);
    const [enableRegex, setEnableRegex] = (0, react_1.useState)(false);
    const replaceText = (0, react_1.useRef)("");
    const searchInputRef = (0, react_1.useRef)();
    const search = (0, react_1.useCallback)((term) => {
        editor.commands.search(term, {
            matchCase,
            enableRegex,
            matchWholeWord,
        });
    }, [matchCase, enableRegex, matchWholeWord]);
    (0, react_1.useEffect)(() => {
        if (!searchInputRef.current)
            return;
        search(searchInputRef.current.value);
    }, [search, matchCase, matchWholeWord, enableRegex]);
    (0, react_1.useEffect)(() => {
        if (selectedText) {
            if (searchInputRef.current) {
                const input = searchInputRef.current;
                setTimeout(() => {
                    input.value = selectedText;
                    input.focus();
                }, 0);
            }
            search(selectedText);
        }
    }, [selectedText, search]);
    return ((0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
            p: 1,
            bg: "background",
            flexDirection: "column",
            boxShadow: ["none", "menu"],
            borderRadius: [0, "default"],
        } }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { flexDirection: "column", flex: 1, width: ["auto", 300], mr: 1 } }, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: {
                                flex: 1,
                                position: "relative",
                                alignItems: "center",
                                outline: "1px solid var(--border)",
                                borderRadius: "default",
                                p: 1,
                                py: 0,
                                ":focus-within": {
                                    outlineColor: "primary",
                                    outlineWidth: "1.8px",
                                },
                                ":hover": {
                                    outlineColor: "primary",
                                },
                            } }, { children: [(0, jsx_runtime_1.jsx)(forms_1.Input, { variant: "clean", defaultValue: selectedText, ref: searchInputRef, autoFocus: true, placeholder: "Find", sx: { p: 0 }, onChange: (e) => {
                                        search(e.target.value);
                                    } }), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: {
                                        flexShrink: 0,
                                        mr: 0,
                                        alignItems: "center",
                                    } }, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { sx: {
                                                mr: 0,
                                            }, toggled: isExpanded, title: "Expand", id: "expand", icon: isExpanded ? "chevronRight" : "chevronLeft", onClick: () => setIsExpanded((s) => !s), iconSize: "medium" }), isExpanded && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { sx: {
                                                        mr: 0,
                                                    }, toggled: matchCase, title: "Match case", id: "matchCase", icon: "caseSensitive", onClick: () => setMatchCase((s) => !s), iconSize: "medium" }), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { sx: {
                                                        mr: 0,
                                                    }, toggled: matchWholeWord, title: "Match whole word", id: "matchWholeWord", icon: "wholeWord", onClick: () => setMatchWholeWord((s) => !s), iconSize: "medium" }), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { sx: {
                                                        mr: 0,
                                                    }, toggled: enableRegex, title: "Enable regex", id: "enableRegex", icon: "regex", onClick: () => setEnableRegex((s) => !s), iconSize: "medium" })] })), (0, jsx_runtime_1.jsxs)(rebass_1.Text, Object.assign({ variant: "subBody", sx: {
                                                flexShrink: 0,
                                                borderLeft: "1px solid var(--border)",
                                                color: "fontTertiary",
                                                px: 1,
                                            } }, { children: [results ? `${results.length}` : "0", isExpanded ? "" : " results"] }))] }))] })), isReplacing && ((0, jsx_runtime_1.jsx)(forms_1.Input, { sx: { mt: 1, p: "7px" }, placeholder: "Replace", onChange: (e) => (replaceText.current = e.target.value) }))] })), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { flexDirection: "column" } }, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { alignItems: "center", height: "33.2px" } }, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: isReplacing, title: "Toggle replace", id: "toggleReplace", icon: "replace", onClick: () => setIsReplacing((s) => !s), sx: { mr: 0 }, iconSize: "big" }), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: "Previous match", id: "previousMatch", icon: "previousMatch", onClick: () => editor.commands.moveToPreviousResult(), sx: { mr: 0 }, iconSize: "big" }), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: "Next match", id: "nextMatch", icon: "nextMatch", onClick: () => editor.commands.moveToNextResult(), sx: { mr: 0 }, iconSize: "big" }), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: "Close", id: "close", icon: "close", onClick: () => editor.chain().focus().endSearch().run(), sx: { mr: 0 }, iconSize: "big" })] })), isReplacing && ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { alignItems: "center", height: "33.2px", mt: 1 } }, { children: [(0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: "Replace", id: "replace", icon: "replaceOne", onClick: () => editor.commands.replace(replaceText.current), sx: { mr: 0 }, iconSize: 18 }), (0, jsx_runtime_1.jsx)(toolbutton_1.ToolButton, { toggled: false, title: "Replace all", id: "replaceAll", icon: "replaceAll", onClick: () => editor.commands.replaceAll(replaceText.current), sx: { mr: 0 }, iconSize: 18 })] })))] }))] }) })));
}
exports.SearchReplacePopup = SearchReplacePopup;
