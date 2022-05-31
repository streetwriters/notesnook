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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom';
var Portals = function (_a) {
    var renderers = _a.renderers;
    return (_jsx(_Fragment, { children: Array.from(renderers).map(function (_a) {
            var _b = __read(_a, 2), key = _b[0], renderer = _b[1];
            return ReactDOM.createPortal(renderer.reactElement, renderer.element, key);
        }) }));
};
var PureEditorContent = /** @class */ (function (_super) {
    __extends(PureEditorContent, _super);
    function PureEditorContent(props) {
        var _this = _super.call(this, props) || this;
        _this.editorContentRef = React.createRef();
        _this.state = {
            renderers: new Map(),
        };
        return _this;
    }
    PureEditorContent.prototype.componentDidMount = function () {
        this.init();
    };
    PureEditorContent.prototype.componentDidUpdate = function () {
        this.init();
    };
    PureEditorContent.prototype.init = function () {
        var editor = this.props.editor;
        if (editor && editor.options.element) {
            if (editor.contentComponent) {
                return;
            }
            var element = this.editorContentRef.current;
            element.append.apply(element, __spreadArray([], __read(editor.options.element.childNodes), false));
            editor.setOptions({
                element: element,
            });
            editor.contentComponent = this;
            editor.createNodeViews();
        }
    };
    PureEditorContent.prototype.componentWillUnmount = function () {
        var editor = this.props.editor;
        if (!editor) {
            return;
        }
        if (!editor.isDestroyed) {
            editor.view.setProps({
                nodeViews: {},
            });
        }
        editor.contentComponent = null;
        if (!editor.options.element.firstChild) {
            return;
        }
        var newElement = document.createElement('div');
        newElement.append.apply(newElement, __spreadArray([], __read(editor.options.element.childNodes), false));
        editor.setOptions({
            element: newElement,
        });
    };
    PureEditorContent.prototype.render = function () {
        var _a = this.props, editor = _a.editor, rest = __rest(_a, ["editor"]);
        return (_jsxs(_Fragment, { children: [_jsx("div", __assign({ ref: this.editorContentRef }, rest)), _jsx(Portals, { renderers: this.state.renderers })] }));
    };
    return PureEditorContent;
}(React.Component));
export { PureEditorContent };
export var EditorContent = React.memo(PureEditorContent);
