"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KatexRenderer = void 0;
var katex_1 = __importDefault(require("katex"));
// Chemistry formulas support
require("katex/contrib/mhchem/mhchem");
exports.KatexRenderer = {
    inline: function (text, element) {
        katex_1.default.render(text, element, {
            displayMode: false,
            globalGroup: true,
            throwOnError: false,
        });
    },
    block: function (text, element) {
        katex_1.default.render(text, element, {
            displayMode: true,
            globalGroup: true,
            throwOnError: false,
        });
    },
};
