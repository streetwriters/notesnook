"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeblockComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const loader_1 = require("./loader");
const core_1 = require("refractor/lib/core");
const rebass_1 = require("rebass");
const languages_json_1 = __importDefault(require("./languages.json"));
const forms_1 = require("@rebass/forms");
const icon_1 = require("../../toolbar/components/icon");
const icons_1 = require("../../toolbar/icons");
const responsive_1 = require("../../components/responsive");
const popup_1 = require("../../toolbar/components/popup");
const button_1 = require("../../components/button");
function CodeblockComponent(props) {
    const { editor, updateAttributes, node, forwardRef } = props;
    const { language, indentLength, indentType, caretPosition } = node === null || node === void 0 ? void 0 : node.attrs;
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    // const [caretPosition, setCaretPosition] = useState<CaretPosition>();
    const toolbarRef = (0, react_1.useRef)(null);
    const languageDefinition = languages_json_1.default.find((l) => { var _a; return l.filename === language || ((_a = l.alias) === null || _a === void 0 ? void 0 : _a.some((a) => a === language)); });
    (0, react_1.useEffect)(() => {
        (function () {
            return __awaiter(this, void 0, void 0, function* () {
                if (!language || !languageDefinition || (0, loader_1.isLanguageLoaded)(language))
                    return;
                const syntax = yield (0, loader_1.loadLanguage)(languageDefinition.filename);
                if (!syntax)
                    return;
                core_1.refractor.register(syntax);
                const preventUpdate = language === languageDefinition.filename;
                updateAttributes({
                    language: languageDefinition.filename,
                }, preventUpdate);
            });
        })();
    }, [language]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: {
                    flexDirection: "column",
                    borderRadius: "default",
                    overflow: "hidden",
                } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, { ref: forwardRef, as: "pre", sx: {
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
                        }, spellCheck: false }), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ ref: toolbarRef, contentEditable: false, sx: {
                            bg: "codeBg",
                            alignItems: "center",
                            justifyContent: "end",
                            borderTop: "1px solid var(--codeBorder)",
                        } }, { children: [caretPosition ? ((0, jsx_runtime_1.jsxs)(rebass_1.Text, Object.assign({ variant: "subBody", sx: { mr: 2, color: "codeFg" } }, { children: ["Line ", caretPosition.line, ", Column ", caretPosition.column, " ", caretPosition.selected
                                        ? `(${caretPosition.selected} selected)`
                                        : ""] }))) : null, (0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ variant: "icon", sx: { p: 1, mr: 1, ":hover": { bg: "codeSelection" } }, title: "Toggle indentation mode", onClick: () => {
                                    editor.commands.changeCodeBlockIndentation({
                                        type: indentType === "space" ? "tab" : "space",
                                        amount: indentLength,
                                    });
                                } }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Text, Object.assign({ variant: "subBody", sx: { color: "codeFg" } }, { children: [indentType === "space" ? "Spaces" : "Tabs", ": ", indentLength] })) })), (0, jsx_runtime_1.jsx)(button_1.Button, Object.assign({ variant: "icon", sx: {
                                    p: 1,
                                    mr: 1,
                                    bg: isOpen ? "codeSelection" : "transparent",
                                    ":hover": { bg: "codeSelection" },
                                }, onClick: () => {
                                    setIsOpen(true);
                                }, title: "Change language" }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ variant: "subBody", spellCheck: false, sx: { color: "codeFg" } }, { children: (languageDefinition === null || languageDefinition === void 0 ? void 0 : languageDefinition.title) || "Plaintext" })) }))] }))] })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, Object.assign({ isOpen: isOpen, onClose: () => {
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
                }, title: "Change code block language" }, { children: (0, jsx_runtime_1.jsx)(LanguageSelector, { selectedLanguage: (languageDefinition === null || languageDefinition === void 0 ? void 0 : languageDefinition.filename) || "Plaintext", onLanguageSelected: (language) => {
                        updateAttributes({ language });
                        setIsOpen(false);
                    }, onClose: () => setIsOpen(false) }) }))] }));
}
exports.CodeblockComponent = CodeblockComponent;
function LanguageSelector(props) {
    const { onLanguageSelected, selectedLanguage, onClose } = props;
    const [languages, setLanguages] = (0, react_1.useState)(languages_json_1.default);
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, Object.assign({ title: "Select language", onClose: onClose }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: {
                flexDirection: "column",
                height: 200,
                width: ["auto", 300],
                overflowY: "auto",
                bg: "background",
            } }, { children: [(0, jsx_runtime_1.jsx)(forms_1.Input, { onFocus: () => {
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
                            return setLanguages(languages_json_1.default);
                        const query = e.target.value.toLowerCase();
                        setLanguages(languages_json_1.default.filter((lang) => {
                            var _a;
                            return (lang.title.toLowerCase().indexOf(query) > -1 ||
                                ((_a = lang.alias) === null || _a === void 0 ? void 0 : _a.some((alias) => alias.toLowerCase().indexOf(query) > -1)));
                        }));
                    } }), (0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
                        flexDirection: "column",
                        pt: 1,
                        mt: 1,
                    } }, { children: languages.map((lang) => ((0, jsx_runtime_1.jsxs)(button_1.Button, Object.assign({ variant: "menuitem", sx: {
                            textAlign: "left",
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }, onClick: () => onLanguageSelected(lang.filename) }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ variant: "body" }, { children: lang.title })), selectedLanguage === lang.filename ? ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.check, size: "small" })) : lang.alias ? ((0, jsx_runtime_1.jsx)(rebass_1.Text, Object.assign({ variant: "subBody", sx: { fontSize: "10px" } }, { children: lang.alias.slice(0, 3).join(", ") }))) : null] }), lang.title))) }))] })) })));
}
