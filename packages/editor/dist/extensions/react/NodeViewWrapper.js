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
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useReactNodeView } from './useReactNodeView';
export var NodeViewWrapper = React.forwardRef(function (props, ref) {
    var onDragStart = useReactNodeView().onDragStart;
    var Tag = props.as || 'div';
    return (_jsx(Tag, __assign({}, props, { ref: ref, "data-node-view-wrapper": "", onDragStart: onDragStart, style: __assign(__assign({}, props.style), { whiteSpace: 'normal' }) })));
});
