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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
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
            popups: [],
        };
        _this.openPopup = function (id, popup) {
            if (!popup)
                return;
            _this.setState(function (prev) {
                return {
                    popups: __spreadArray(__spreadArray([], __read(prev.popups), false), [{ id: id, popup: popup }], false),
                };
            });
        };
        _this.closePopup = function (id) {
            _this.setState(function (prev) {
                var index = prev.popups.findIndex(function (p) { return p.id === id; });
                console.log("[closePopup] ", index, id);
                if (index <= -1)
                    return prev;
                var clone = prev.popups.slice();
                clone.splice(index, 1);
                return {
                    popups: clone,
                };
            });
        };
        return _this;
    }
    PopupRenderer.prototype.render = function () {
        return (_jsxs(PopupRendererContext.Provider, __assign({ value: this }, { children: [this.props.children, _jsxs(EditorContext.Provider, __assign({ value: this.props.editor }, { children: [this.state.popups.map(function (_a) {
                            var id = _a.id, Popup = _a.popup;
                            console.log("rendering poopup", id);
                            return _jsx(Popup, { id: id }, id);
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
