"use strict";
/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mathSerializer = exports.insertMathNode = exports.mathSelectPlugin = exports.REGEX_INLINE_MATH_DOLLARS_ESCAPED = exports.REGEX_INLINE_MATH_DOLLARS = exports.REGEX_BLOCK_MATH_DOLLARS = exports.makeInlineMathInputRule = exports.makeBlockMathInputRule = exports.mathBackspaceCmd = exports.createMathSchema = exports.mathSchemaSpec = exports.createMathView = exports.mathPlugin = exports.MathView = void 0;
// core functionality
var math_nodeview_1 = require("./math-nodeview");
Object.defineProperty(exports, "MathView", { enumerable: true, get: function () { return math_nodeview_1.MathView; } });
var math_plugin_1 = require("./math-plugin");
Object.defineProperty(exports, "mathPlugin", { enumerable: true, get: function () { return math_plugin_1.mathPlugin; } });
Object.defineProperty(exports, "createMathView", { enumerable: true, get: function () { return math_plugin_1.createMathView; } });
var math_schema_1 = require("./math-schema");
Object.defineProperty(exports, "mathSchemaSpec", { enumerable: true, get: function () { return math_schema_1.mathSchemaSpec; } });
Object.defineProperty(exports, "createMathSchema", { enumerable: true, get: function () { return math_schema_1.createMathSchema; } });
// recommended plugins
var math_backspace_1 = require("./plugins/math-backspace");
Object.defineProperty(exports, "mathBackspaceCmd", { enumerable: true, get: function () { return math_backspace_1.mathBackspaceCmd; } });
var math_inputrules_1 = require("./plugins/math-inputrules");
Object.defineProperty(exports, "makeBlockMathInputRule", { enumerable: true, get: function () { return math_inputrules_1.makeBlockMathInputRule; } });
Object.defineProperty(exports, "makeInlineMathInputRule", { enumerable: true, get: function () { return math_inputrules_1.makeInlineMathInputRule; } });
Object.defineProperty(exports, "REGEX_BLOCK_MATH_DOLLARS", { enumerable: true, get: function () { return math_inputrules_1.REGEX_BLOCK_MATH_DOLLARS; } });
Object.defineProperty(exports, "REGEX_INLINE_MATH_DOLLARS", { enumerable: true, get: function () { return math_inputrules_1.REGEX_INLINE_MATH_DOLLARS; } });
Object.defineProperty(exports, "REGEX_INLINE_MATH_DOLLARS_ESCAPED", { enumerable: true, get: function () { return math_inputrules_1.REGEX_INLINE_MATH_DOLLARS_ESCAPED; } });
// optional / experimental plugins
var math_select_1 = require("./plugins/math-select");
Object.defineProperty(exports, "mathSelectPlugin", { enumerable: true, get: function () { return math_select_1.mathSelectPlugin; } });
// commands
var insertmathnode_1 = require("./commands/insertmathnode");
Object.defineProperty(exports, "insertMathNode", { enumerable: true, get: function () { return insertmathnode_1.insertMathNode; } });
// utilities
var text_serializer_1 = require("./utils/text-serializer");
Object.defineProperty(exports, "mathSerializer", { enumerable: true, get: function () { return text_serializer_1.mathSerializer; } });
__exportStar(require("./utils/types"), exports);
