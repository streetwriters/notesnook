"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeblockComponent = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var loader_1 = require("./loader");
var core_1 = require("refractor/lib/core");
var rebass_1 = require("rebass");
var languages_json_1 = __importDefault(require("./languages.json"));
var forms_1 = require("@rebass/forms");
var icon_1 = require("../../toolbar/components/icon");
var icons_1 = require("../../toolbar/icons");
var responsive_1 = require("../../components/responsive");
var popup_1 = require("../../toolbar/components/popup");
var button_1 = require("../../components/button");
function CodeblockComponent(props) {
    var editor = props.editor, updateAttributes = props.updateAttributes, node = props.node, forwardRef = props.forwardRef;
    var _a = node === null || node === void 0 ? void 0 : node.attrs, language = _a.language, indentLength = _a.indentLength, indentType = _a.indentType, caretPosition = _a.caretPosition;
    var _b = __read((0, react_1.useState)(false), 2), isOpen = _b[0], setIsOpen = _b[1];
    // const [caretPosition, setCaretPosition] = useState<CaretPosition>();
    var toolbarRef = (0, react_1.useRef)(null);
    var languageDefinition = languages_json_1.default.find(function (l) { var _a; return l.filename === language || ((_a = l.alias) === null || _a === void 0 ? void 0 : _a.some(function (a) { return a === language; })); });
    (0, react_1.useEffect)(function () {
        (function () {
            return __awaiter(this, void 0, void 0, function () {
                var syntax;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!language || !languageDefinition || (0, loader_1.isLanguageLoaded)(language))
                                return [2 /*return*/];
                            return [4 /*yield*/, (0, loader_1.loadLanguage)(languageDefinition.filename)];
                        case 1:
                            syntax = _a.sent();
                            if (!syntax)
                                return [2 /*return*/];
                            core_1.refractor.register(syntax);
                            updateAttributes({
                                language: languageDefinition.filename,
                            });
                            return [2 /*return*/];
                    }
                });
            });
        })();
    }, [language]);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: {
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
                        }, spellCheck: false }), (0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ ref: toolbarRef, contentEditable: false, sx: {
                            bg: "codeBg",
                            alignItems: "center",
                            justifyContent: "end",
                            borderTop: "1px solid var(--codeBorder)",
                        } }, { children: [caretPosition ? ((0, jsx_runtime_1.jsxs)(rebass_1.Text, __assign({ variant: "subBody", sx: { mr: 2, color: "codeFg" } }, { children: ["Line ", caretPosition.line, ", Column ", caretPosition.column, " ", caretPosition.selected
                                        ? "(".concat(caretPosition.selected, " selected)")
                                        : ""] }))) : null, (0, jsx_runtime_1.jsx)(button_1.Button, __assign({ variant: "icon", sx: { p: 1, mr: 1, ":hover": { bg: "codeSelection" } }, title: "Toggle indentation mode", onClick: function () {
                                    editor.commands.changeCodeBlockIndentation({
                                        type: indentType === "space" ? "tab" : "space",
                                        amount: indentLength,
                                    });
                                } }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Text, __assign({ variant: "subBody", sx: { color: "codeFg" } }, { children: [indentType === "space" ? "Spaces" : "Tabs", ": ", indentLength] })) })), (0, jsx_runtime_1.jsx)(button_1.Button, __assign({ variant: "icon", sx: {
                                    p: 1,
                                    mr: 1,
                                    bg: isOpen ? "codeSelection" : "transparent",
                                    ":hover": { bg: "codeSelection" },
                                }, onClick: function () {
                                    setIsOpen(true);
                                }, title: "Change language" }, { children: (0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "subBody", spellCheck: false, sx: { color: "codeFg" } }, { children: (languageDefinition === null || languageDefinition === void 0 ? void 0 : languageDefinition.title) || "Plaintext" })) }))] }))] })), (0, jsx_runtime_1.jsx)(responsive_1.ResponsivePresenter, __assign({ isOpen: isOpen, onClose: function () {
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
                }, title: "Change code block language" }, { children: (0, jsx_runtime_1.jsx)(LanguageSelector, { selectedLanguage: (languageDefinition === null || languageDefinition === void 0 ? void 0 : languageDefinition.filename) || "Plaintext", onLanguageSelected: function (language) {
                        updateAttributes({ language: language });
                        setIsOpen(false);
                    }, onClose: function () { return setIsOpen(false); } }) }))] }));
}
exports.CodeblockComponent = CodeblockComponent;
function LanguageSelector(props) {
    var onLanguageSelected = props.onLanguageSelected, selectedLanguage = props.selectedLanguage, onClose = props.onClose;
    var _a = __read((0, react_1.useState)(languages_json_1.default), 2), languages = _a[0], setLanguages = _a[1];
    return ((0, jsx_runtime_1.jsx)(popup_1.Popup, __assign({ title: "Select language", onClose: onClose }, { children: (0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: {
                flexDirection: "column",
                height: 200,
                width: ["auto", 300],
                overflowY: "auto",
                bg: "background",
            } }, { children: [(0, jsx_runtime_1.jsx)(forms_1.Input, { onFocus: function () {
                        console.log("EHLLO!");
                    }, autoFocus: true, placeholder: "Search languages", sx: {
                        width: "auto",
                        position: "sticky",
                        top: 0,
                        bg: "background",
                        mx: 2,
                        p: "7px",
                        zIndex: 999,
                    }, onChange: function (e) {
                        if (!e.target.value)
                            return setLanguages(languages_json_1.default);
                        var query = e.target.value.toLowerCase();
                        setLanguages(languages_json_1.default.filter(function (lang) {
                            var _a;
                            return (lang.title.toLowerCase().indexOf(query) > -1 ||
                                ((_a = lang.alias) === null || _a === void 0 ? void 0 : _a.some(function (alias) { return alias.toLowerCase().indexOf(query) > -1; })));
                        }));
                    } }), (0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ sx: {
                        flexDirection: "column",
                        pt: 1,
                        mt: 1,
                    } }, { children: languages.map(function (lang) { return ((0, jsx_runtime_1.jsxs)(button_1.Button, __assign({ variant: "menuitem", sx: {
                            textAlign: "left",
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }, onClick: function () { return onLanguageSelected(lang.filename); } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "body" }, { children: lang.title })), selectedLanguage === lang.filename ? ((0, jsx_runtime_1.jsx)(icon_1.Icon, { path: icons_1.Icons.check, size: "small" })) : lang.alias ? ((0, jsx_runtime_1.jsx)(rebass_1.Text, __assign({ variant: "subBody", sx: { fontSize: "10px" } }, { children: lang.alias.slice(0, 3).join(", ") }))) : null] }), lang.title)); }) }))] })) })));
}
