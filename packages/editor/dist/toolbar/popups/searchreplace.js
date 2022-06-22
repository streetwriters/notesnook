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
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@rebass/forms";
import { useCallback, useEffect, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { ToolButton } from "../components/tool-button";
export function SearchReplacePopup(props) {
    var editor = props.editor;
    var _a = editor.storage
        .searchreplace, selectedText = _a.selectedText, results = _a.results;
    var _b = __read(useState(false), 2), isReplacing = _b[0], setIsReplacing = _b[1];
    var _c = __read(useState(false), 2), isExpanded = _c[0], setIsExpanded = _c[1];
    var _d = __read(useState(false), 2), matchCase = _d[0], setMatchCase = _d[1];
    var _e = __read(useState(false), 2), matchWholeWord = _e[0], setMatchWholeWord = _e[1];
    var _f = __read(useState(false), 2), enableRegex = _f[0], setEnableRegex = _f[1];
    var replaceText = useRef("");
    var searchInputRef = useRef();
    var search = useCallback(function (term) {
        editor.commands.search(term, {
            matchCase: matchCase,
            enableRegex: enableRegex,
            matchWholeWord: matchWholeWord,
        });
    }, [matchCase, enableRegex, matchWholeWord]);
    useEffect(function () {
        if (!searchInputRef.current)
            return;
        search(searchInputRef.current.value);
    }, [search, matchCase, matchWholeWord, enableRegex]);
    useEffect(function () {
        if (selectedText) {
            if (searchInputRef.current) {
                var input_1 = searchInputRef.current;
                setTimeout(function () {
                    input_1.value = selectedText;
                    input_1.focus();
                }, 0);
            }
            search(selectedText);
        }
    }, [selectedText, search]);
    return (_jsx(Flex, __assign({ sx: {
            p: 1,
            bg: "background",
            flexDirection: "column",
            boxShadow: ["none", "menu"],
            borderRadius: [0, "default"],
        } }, { children: _jsxs(Flex, { children: [_jsxs(Flex, __assign({ sx: { flexDirection: "column", flex: 1, width: ["auto", 300], mr: 1 } }, { children: [_jsxs(Flex, __assign({ sx: {
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
                            } }, { children: [_jsx(Input, { variant: "clean", defaultValue: selectedText, ref: searchInputRef, autoFocus: true, placeholder: "Find", sx: { p: 0 }, onChange: function (e) {
                                        search(e.target.value);
                                    } }), _jsxs(Flex, __assign({ sx: {
                                        flexShrink: 0,
                                        mr: 0,
                                        alignItems: "center",
                                    } }, { children: [_jsx(ToolButton, { sx: {
                                                mr: 0,
                                            }, toggled: isExpanded, title: "Expand", id: "expand", icon: isExpanded ? "chevronRight" : "chevronLeft", onClick: function () { return setIsExpanded(function (s) { return !s; }); }, iconSize: "medium" }), isExpanded && (_jsxs(_Fragment, { children: [_jsx(ToolButton, { sx: {
                                                        mr: 0,
                                                    }, toggled: matchCase, title: "Match case", id: "matchCase", icon: "caseSensitive", onClick: function () { return setMatchCase(function (s) { return !s; }); }, iconSize: "medium" }), _jsx(ToolButton, { sx: {
                                                        mr: 0,
                                                    }, toggled: matchWholeWord, title: "Match whole word", id: "matchWholeWord", icon: "wholeWord", onClick: function () { return setMatchWholeWord(function (s) { return !s; }); }, iconSize: "medium" }), _jsx(ToolButton, { sx: {
                                                        mr: 0,
                                                    }, toggled: enableRegex, title: "Enable regex", id: "enableRegex", icon: "regex", onClick: function () { return setEnableRegex(function (s) { return !s; }); }, iconSize: "medium" })] })), _jsxs(Text, __assign({ variant: "subBody", sx: {
                                                flexShrink: 0,
                                                borderLeft: "1px solid var(--border)",
                                                color: "fontTertiary",
                                                px: 1,
                                            } }, { children: [results ? "".concat(results.length) : "0", isExpanded ? "" : " results"] }))] }))] })), isReplacing && (_jsx(Input, { sx: { mt: 1, p: "7px" }, placeholder: "Replace", onChange: function (e) { return (replaceText.current = e.target.value); } }))] })), _jsxs(Flex, __assign({ sx: { flexDirection: "column" } }, { children: [_jsxs(Flex, __assign({ sx: { alignItems: "center", height: "33.2px" } }, { children: [_jsx(ToolButton, { toggled: isReplacing, title: "Toggle replace", id: "toggleReplace", icon: "replace", onClick: function () { return setIsReplacing(function (s) { return !s; }); }, sx: { mr: 0 }, iconSize: "big" }), _jsx(ToolButton, { toggled: false, title: "Previous match", id: "previousMatch", icon: "previousMatch", onClick: function () { return editor.commands.moveToPreviousResult(); }, sx: { mr: 0 }, iconSize: "big" }), _jsx(ToolButton, { toggled: false, title: "Next match", id: "nextMatch", icon: "nextMatch", onClick: function () { return editor.commands.moveToNextResult(); }, sx: { mr: 0 }, iconSize: "big" }), _jsx(ToolButton, { toggled: false, title: "Close", id: "close", icon: "close", onClick: function () { return editor.chain().focus().endSearch().run(); }, sx: { mr: 0 }, iconSize: "big" })] })), isReplacing && (_jsxs(Flex, __assign({ sx: { alignItems: "center", height: "33.2px", mt: 1 } }, { children: [_jsx(ToolButton, { toggled: false, title: "Replace", id: "replace", icon: "replaceOne", onClick: function () { return editor.commands.replace(replaceText.current); }, sx: { mr: 0 }, iconSize: 18 }), _jsx(ToolButton, { toggled: false, title: "Replace all", id: "replaceAll", icon: "replaceAll", onClick: function () { return editor.commands.replaceAll(replaceText.current); }, sx: { mr: 0 }, iconSize: 18 })] })))] }))] }) })));
}
