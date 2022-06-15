var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import React, { useContext } from "react";
export var PopupRendererContext = React.createContext(null);
export var EditorContext = React.createContext(null);
var PopupRenderer = /** @class */ (function (_super) {
    __extends(PopupRenderer, _super);
    function PopupRenderer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.popupContainer = null;
        _this.state = {
            popups: {},
        };
        return _this;
    }
    PopupRenderer.prototype.openPopup = function (id, popup) {
        var _a;
        this.setState({ popups: __assign(__assign({}, this.state.popups), (_a = {}, _a[id] = popup, _a)) });
    };
    PopupRenderer.prototype.closePopup = function (id) {
        var _a;
        this.setState({ popups: __assign(__assign({}, this.state.popups), (_a = {}, _a[id] = null, _a)) });
    };
    PopupRenderer.prototype.render = function () {
        return (_jsxs(PopupRendererContext.Provider, __assign({ value: this }, { children: [this.props.children, _jsxs(EditorContext.Provider, __assign({ value: this.props.editor }, { children: [Object.entries(this.state.popups).map(function (_a) {
                            var _b = __read(_a, 2), id = _b[0], Popup = _b[1];
                            if (!Popup)
                                return null;
                            return _jsx(Popup, {}, id);
                        }), _jsx("div", { id: "popup-container" })] }))] })));
    };
    return PopupRenderer;
}(React.Component));
export { PopupRenderer };
export function usePopupRenderer() {
    return useContext(PopupRendererContext);
}
export function useEditorContext() {
    return useContext(EditorContext);
}
