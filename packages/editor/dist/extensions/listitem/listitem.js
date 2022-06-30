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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItem = void 0;
var extension_list_item_1 = require("@tiptap/extension-list-item");
var commands_1 = require("./commands");
exports.ListItem = extension_list_item_1.ListItem.extend({
    addKeyboardShortcuts: function () {
        var _this = this;
        var _a;
        return __assign(__assign({}, (_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)), { Backspace: function (_a) {
                var editor = _a.editor;
                return (0, commands_1.onBackspacePressed)(editor, _this.name, _this.type);
            } });
    },
});
