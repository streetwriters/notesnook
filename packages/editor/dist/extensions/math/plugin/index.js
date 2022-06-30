/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/
// core functionality
export { MathView } from "./math-node-view";
export { mathPlugin, createMathView, } from "./math-plugin";
export { mathSchemaSpec, createMathSchema } from "./math-schema";
// recommended plugins
export { mathBackspaceCmd } from "./plugins/math-backspace";
export { makeBlockMathInputRule, makeInlineMathInputRule, REGEX_BLOCK_MATH_DOLLARS, REGEX_INLINE_MATH_DOLLARS, REGEX_INLINE_MATH_DOLLARS_ESCAPED, } from "./plugins/math-input-rules";
// optional / experimental plugins
export { mathSelectPlugin } from "./plugins/math-select";
// commands
export { insertMathNode } from "./commands/insert-math-node";
// utilities
export { mathSerializer } from "./utils/text-serializer";
export * from "./utils/types";
