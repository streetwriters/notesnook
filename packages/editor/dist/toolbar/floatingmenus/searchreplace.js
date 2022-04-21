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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@rebass/forms";
import { useCallback, useEffect, useRef, useState } from "react";
import { Flex } from "rebass";
import { MenuPresenter } from "../../components/menu/menu";
import { Popup } from "../components/popup";
import { ToolButton } from "../components/tool-button";
export function SearchReplaceFloatingMenu(props) {
    var editor = props.editor;
    var _a = editor.storage
        .searchreplace, isSearching = _a.isSearching, selectedText = _a.selectedText;
    var _b = __read(useState(false), 2), matchCase = _b[0], setMatchCase = _b[1];
    var _c = __read(useState(false), 2), matchWholeWord = _c[0], setMatchWholeWord = _c[1];
    var _d = __read(useState(false), 2), enableRegex = _d[0], setEnableRegex = _d[1];
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
        if (isSearching && selectedText) {
            if (searchInputRef.current) {
                var input_1 = searchInputRef.current;
                setTimeout(function () {
                    input_1.value = selectedText;
                    input_1.focus();
                }, 0);
            }
            search(selectedText);
        }
    }, [isSearching, selectedText, search]);
    if (!isSearching)
        return null;
    return (_jsx(MenuPresenter, __assign({ isOpen: true, items: [], onClose: function () { }, options: {
            type: "autocomplete",
            position: {
                target: document.querySelector(".editor-toolbar") || "mouse",
                isTargetAbsolute: true,
                location: "below",
                align: "end",
            },
        } }, { children: _jsx(Popup, { children: _jsxs(Flex, __assign({ sx: { p: 1, flexDirection: "column" } }, { children: [_jsxs(Flex, __assign({ sx: { alignItems: "start", flexShrink: 0 } }, { children: [_jsxs(Flex, __assign({ sx: {
                                    position: "relative",
                                    mr: 1,
                                    width: 200,
                                    alignItems: "center",
                                } }, { children: [_jsx(Input, { defaultValue: selectedText, ref: searchInputRef, autoFocus: true, sx: { p: 1 }, placeholder: "Find", onChange: function (e) {
                                            search(e.target.value);
                                        } }), _jsxs(Flex, __assign({ sx: {
                                            position: "absolute",
                                            right: 0,
                                            mr: 0,
                                        } }, { children: [_jsx(ToolButton, { sx: {
                                                    mr: 0,
                                                }, toggled: matchCase, title: "Match case", id: "matchCase", icon: "caseSensitive", onClick: function () { return setMatchCase(function (s) { return !s; }); }, iconSize: 14 }), _jsx(ToolButton, { sx: {
                                                    mr: 0,
                                                }, toggled: matchWholeWord, title: "Match whole word", id: "matchWholeWord", icon: "wholeWord", onClick: function () { return setMatchWholeWord(function (s) { return !s; }); }, iconSize: 14 }), _jsx(ToolButton, { sx: {
                                                    mr: 0,
                                                }, toggled: enableRegex, title: "Enable regex", id: "enableRegex", icon: "regex", onClick: function () { return setEnableRegex(function (s) { return !s; }); }, iconSize: 14 })] }))] })), _jsx(ToolButton, { toggled: false, title: "Previous match", id: "previousMatch", icon: "previousMatch", onClick: function () { return editor.commands.moveToPreviousResult(); }, sx: { mr: 0 }, iconSize: 16 }), _jsx(ToolButton, { toggled: false, title: "Next match", id: "nextMatch", icon: "nextMatch", onClick: function () { return editor.commands.moveToNextResult(); }, sx: { mr: 0 }, iconSize: 16 }), _jsx(ToolButton, { toggled: false, title: "Close", id: "close", icon: "close", onClick: function () { return editor.chain().focus().endSearch().run(); }, iconSize: 16, sx: { mr: 0 } })] })), _jsxs(Flex, __assign({ sx: { alignItems: "start", flexShrink: 0, mt: 1 } }, { children: [_jsx(Input, { sx: { p: 1, width: 200, mr: 1 }, placeholder: "Replace", onChange: function (e) { return (replaceText.current = e.target.value); } }), _jsx(ToolButton, { toggled: false, title: "Replace", id: "replace", icon: "replaceOne", onClick: function () { return editor.commands.replace(replaceText.current); }, sx: { mr: 0 }, iconSize: 16 }), _jsx(ToolButton, { toggled: false, title: "Replace all", id: "replaceAll", icon: "replaceAll", onClick: function () { return editor.commands.replaceAll(replaceText.current); }, sx: { mr: 0 }, iconSize: 16 })] }))] })) }) })));
}
