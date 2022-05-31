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
import { jsx as _jsx } from "react/jsx-runtime";
function isClassComponent(Component) {
    return !!(typeof Component === 'function'
        && Component.prototype
        && Component.prototype.isReactComponent);
}
function isForwardRefComponent(Component) {
    var _a;
    return !!(typeof Component === 'object'
        && ((_a = Component.$$typeof) === null || _a === void 0 ? void 0 : _a.toString()) === 'Symbol(react.forward_ref)');
}
var ReactRenderer = /** @class */ (function () {
    function ReactRenderer(component, _a) {
        var _b;
        var editor = _a.editor, _c = _a.props, props = _c === void 0 ? {} : _c, _d = _a.as, as = _d === void 0 ? 'div' : _d, _e = _a.className, className = _e === void 0 ? '' : _e;
        this.ref = null;
        this.id = Math.floor(Math.random() * 0xFFFFFFFF).toString();
        this.component = component;
        this.editor = editor;
        this.props = props;
        this.element = document.createElement(as);
        this.element.classList.add('react-renderer');
        if (className) {
            (_b = this.element.classList).add.apply(_b, __spreadArray([], __read(className.split(' ')), false));
        }
        this.render();
    }
    ReactRenderer.prototype.render = function () {
        var _this = this;
        var _a;
        var Component = this.component;
        var props = this.props;
        if (isClassComponent(Component) || isForwardRefComponent(Component)) {
            props.ref = function (ref) {
                _this.ref = ref;
            };
        }
        this.reactElement = _jsx(Component, __assign({}, props));
        if ((_a = this.editor) === null || _a === void 0 ? void 0 : _a.contentComponent) {
            this.editor.contentComponent.setState({
                renderers: this.editor.contentComponent.state.renderers.set(this.id, this),
            });
        }
    };
    ReactRenderer.prototype.updateProps = function (props) {
        if (props === void 0) { props = {}; }
        this.props = __assign(__assign({}, this.props), props);
        this.render();
    };
    ReactRenderer.prototype.destroy = function () {
        var _a;
        if ((_a = this.editor) === null || _a === void 0 ? void 0 : _a.contentComponent) {
            var renderers = this.editor.contentComponent.state.renderers;
            renderers.delete(this.id);
            this.editor.contentComponent.setState({
                renderers: renderers,
            });
        }
    };
    return ReactRenderer;
}());
export { ReactRenderer };
