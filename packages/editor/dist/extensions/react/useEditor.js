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
import { useState, useEffect } from 'react';
import { Editor } from './Editor';
function useForceUpdate() {
    var _a = __read(useState(0), 2), setValue = _a[1];
    return function () { return setValue(function (value) { return value + 1; }); };
}
export var useEditor = function (options, deps) {
    if (options === void 0) { options = {}; }
    if (deps === void 0) { deps = []; }
    var _a = __read(useState(null), 2), editor = _a[0], setEditor = _a[1];
    var forceUpdate = useForceUpdate();
    useEffect(function () {
        var instance = new Editor(options);
        setEditor(instance);
        instance.on('transaction', function () {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    forceUpdate();
                });
            });
        });
        return function () {
            instance.destroy();
        };
    }, deps);
    return editor;
};
