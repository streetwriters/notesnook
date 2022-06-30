/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/

// core functionality
export { MathView, type ICursorPosObserver } from "./math-node-view";
export {
  mathPlugin,
  createMathView,
  type IMathPluginState,
} from "./math-plugin";
export { mathSchemaSpec, createMathSchema } from "./math-schema";

// recommended plugins
export { mathBackspaceCmd } from "./plugins/math-backspace";
export {
  makeBlockMathInputRule,
  makeInlineMathInputRule,
  REGEX_BLOCK_MATH_DOLLARS,
  REGEX_INLINE_MATH_DOLLARS,
  REGEX_INLINE_MATH_DOLLARS_ESCAPED,
} from "./plugins/math-input-rules";

// optional / experimental plugins
export { mathSelectPlugin } from "./plugins/math-select";

// commands
export { insertMathCmd } from "./commands/insert-math-cmd";

// utilities
export { mathSerializer } from "./utils/text-serializer";
export * from "./utils/types";
