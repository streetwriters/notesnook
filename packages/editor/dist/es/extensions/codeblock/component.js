var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { isLanguageLoaded, loadLanguage } from "./loader";
import { refractor } from "refractor/lib/core";
import { Flex, Text } from "rebass";
import Languages from "./languages.json";
import { Input } from "@rebass/forms";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { ResponsivePresenter } from "../../components/responsive";
import { Popup } from "../../toolbar/components/popup";
import { Button } from "../../components/button";
export function CodeblockComponent(props) {
    const { editor, updateAttributes, node, forwardRef } = props;
    const { language, indentLength, indentType, caretPosition } = node === null || node === void 0 ? void 0 : node.attrs;
    const [isOpen, setIsOpen] = useState(false);
    // const [caretPosition, setCaretPosition] = useState<CaretPosition>();
    const toolbarRef = useRef(null);
    const languageDefinition = Languages.find((l) => { var _a; return l.filename === language || ((_a = l.alias) === null || _a === void 0 ? void 0 : _a.some((a) => a === language)); });
    useEffect(() => {
        (function () {
            return __awaiter(this, void 0, void 0, function* () {
                if (!language || !languageDefinition || isLanguageLoaded(language))
                    return;
                const syntax = yield loadLanguage(languageDefinition.filename);
                if (!syntax)
                    return;
                refractor.register(syntax);
                updateAttributes({
                    language: languageDefinition.filename,
                });
            });
        })();
    }, [language]);
    return (_jsxs(_Fragment, { children: [_jsxs(Flex, Object.assign({ sx: {
                    flexDirection: "column",
                    borderRadius: "default",
                    overflow: "hidden",
                } }, { children: [_jsx(Text, { ref: forwardRef, as: "pre", sx: {
                            "div, span.token, span.line-number-widget, span.line-number::before": {
                                fontFamily: "monospace",
                                fontSize: "code",
                                whiteSpace: "pre !important",
                                tabSize: 1,
                            },
                            position: "relative",
                            lineHeight: "20px",
                            bg: "codeBg",
                            color: "static",
                            overflowX: "auto",
                            display: "flex",
                            px: 2,
                            pt: 2,
                            pb: 1,
                        }, spellCheck: false }), _jsxs(Flex, Object.assign({ ref: toolbarRef, contentEditable: false, sx: {
                            bg: "codeBg",
                            alignItems: "center",
                            justifyContent: "end",
                            borderTop: "1px solid var(--codeBorder)",
                        } }, { children: [caretPosition ? (_jsxs(Text, Object.assign({ variant: "subBody", sx: { mr: 2, color: "codeFg" } }, { children: ["Line ", caretPosition.line, ", Column ", caretPosition.column, " ", caretPosition.selected
                                        ? `(${caretPosition.selected} selected)`
                                        : ""] }))) : null, _jsx(Button, Object.assign({ variant: "icon", sx: { p: 1, mr: 1, ":hover": { bg: "codeSelection" } }, title: "Toggle indentation mode", onClick: () => {
                                    editor.commands.changeCodeBlockIndentation({
                                        type: indentType === "space" ? "tab" : "space",
                                        amount: indentLength,
                                    });
                                } }, { children: _jsxs(Text, Object.assign({ variant: "subBody", sx: { color: "codeFg" } }, { children: [indentType === "space" ? "Spaces" : "Tabs", ": ", indentLength] })) })), _jsx(Button, Object.assign({ variant: "icon", sx: {
                                    p: 1,
                                    mr: 1,
                                    bg: isOpen ? "codeSelection" : "transparent",
                                    ":hover": { bg: "codeSelection" },
                                }, onClick: () => {
                                    setIsOpen(true);
                                }, title: "Change language" }, { children: _jsx(Text, Object.assign({ variant: "subBody", spellCheck: false, sx: { color: "codeFg" } }, { children: (languageDefinition === null || languageDefinition === void 0 ? void 0 : languageDefinition.title) || "Plaintext" })) }))] }))] })), _jsx(ResponsivePresenter, Object.assign({ isOpen: isOpen, onClose: () => {
                    setIsOpen(false);
                    // NOTE: for some reason the language selection action sheet
                    // does not return focus to the last focused position after
                    // closing. We have to set focusOnRender=false & manually
                    // restore focus. I think this has something to do with custom
                    // node views.
                    // TRY: perhaps use SelectionBasedReactNodeView?
                    editor.commands.focus();
                }, focusOnRender: false, mobile: "sheet", desktop: "menu", position: {
                    target: toolbarRef.current || undefined,
                    align: "end",
                    isTargetAbsolute: true,
                    location: "top",
                    yOffset: 5,
                }, title: "Change code block language" }, { children: _jsx(LanguageSelector, { selectedLanguage: (languageDefinition === null || languageDefinition === void 0 ? void 0 : languageDefinition.filename) || "Plaintext", onLanguageSelected: (language) => {
                        updateAttributes({ language });
                        setIsOpen(false);
                    }, onClose: () => setIsOpen(false) }) }))] }));
}
function LanguageSelector(props) {
    const { onLanguageSelected, selectedLanguage, onClose } = props;
    const [languages, setLanguages] = useState(Languages);
    return (_jsx(Popup, Object.assign({ title: "Select language", onClose: onClose }, { children: _jsxs(Flex, Object.assign({ sx: {
                flexDirection: "column",
                height: 200,
                width: ["auto", 300],
                overflowY: "auto",
                bg: "background",
            } }, { children: [_jsx(Input, { onFocus: () => {
                        console.log("EHLLO!");
                    }, autoFocus: true, placeholder: "Search languages", sx: {
                        width: "auto",
                        position: "sticky",
                        top: 0,
                        bg: "background",
                        mx: 2,
                        p: "7px",
                        zIndex: 999,
                    }, onChange: (e) => {
                        if (!e.target.value)
                            return setLanguages(Languages);
                        const query = e.target.value.toLowerCase();
                        setLanguages(Languages.filter((lang) => {
                            var _a;
                            return (lang.title.toLowerCase().indexOf(query) > -1 ||
                                ((_a = lang.alias) === null || _a === void 0 ? void 0 : _a.some((alias) => alias.toLowerCase().indexOf(query) > -1)));
                        }));
                    } }), _jsx(Flex, Object.assign({ sx: {
                        flexDirection: "column",
                        pt: 1,
                        mt: 1,
                    } }, { children: languages.map((lang) => (_jsxs(Button, Object.assign({ variant: "menuitem", sx: {
                            textAlign: "left",
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }, onClick: () => onLanguageSelected(lang.filename) }, { children: [_jsx(Text, Object.assign({ variant: "body" }, { children: lang.title })), selectedLanguage === lang.filename ? (_jsx(Icon, { path: Icons.check, size: "small" })) : lang.alias ? (_jsx(Text, Object.assign({ variant: "subBody", sx: { fontSize: "10px" } }, { children: lang.alias.slice(0, 3).join(", ") }))) : null] }), lang.title))) }))] })) })));
}
