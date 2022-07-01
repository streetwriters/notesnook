import { InputRule } from "prosemirror-inputrules";
import { NodeType } from "prosemirror-model";
export declare const REGEX_INLINE_MATH_DOLLARS: RegExp;
export declare const REGEX_INLINE_MATH_DOLLARS_ESCAPED: RegExp;
export declare const REGEX_BLOCK_MATH_DOLLARS: RegExp;
export declare function makeInlineMathInputRule(pattern: RegExp, nodeType: NodeType, getAttrs?: (match: string[]) => any): InputRule;
export declare function makeBlockMathInputRule(pattern: RegExp, nodeType: NodeType, getAttrs?: (match: string[]) => any): InputRule;
