"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEditorContext = exports.usePopupRenderer = exports.PopupRenderer = exports.EditorContext = exports.PopupRendererContext = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
exports.PopupRendererContext = react_1.default.createContext(null);
exports.EditorContext = react_1.default.createContext(null);
class PopupRenderer extends react_1.default.Component {
    constructor() {
        super(...arguments);
        this.popupContainer = null;
        this.state = {
            popups: [],
        };
        this.openPopup = (id, popup) => {
            if (!popup)
                return;
            this.setState((prev) => {
                return {
                    popups: [...prev.popups, { id, popup }],
                };
            });
        };
        this.closePopup = (id) => {
            this.setState((prev) => {
                const index = prev.popups.findIndex((p) => p.id === id);
                if (index <= -1)
                    return prev;
                const clone = prev.popups.slice();
                clone.splice(index, 1);
                return {
                    popups: clone,
                };
            });
        };
    }
    render() {
        return ((0, jsx_runtime_1.jsxs)(exports.PopupRendererContext.Provider, Object.assign({ value: this }, { children: [this.props.children, (0, jsx_runtime_1.jsxs)(exports.EditorContext.Provider, Object.assign({ value: this.props.editor }, { children: [this.state.popups.map(({ id, popup: Popup }) => {
                            return (0, jsx_runtime_1.jsx)(Popup, { id: id }, id);
                        }), (0, jsx_runtime_1.jsx)("div", { id: "popup-container" })] }))] })));
    }
}
exports.PopupRenderer = PopupRenderer;
function usePopupRenderer() {
    return (0, react_1.useContext)(exports.PopupRendererContext);
}
exports.usePopupRenderer = usePopupRenderer;
function useEditorContext() {
    return (0, react_1.useContext)(exports.EditorContext);
}
exports.useEditorContext = useEditorContext;
