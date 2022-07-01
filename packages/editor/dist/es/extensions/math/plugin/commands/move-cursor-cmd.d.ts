import { Command } from "prosemirror-state";
/**
 * Some browsers (cough firefox cough) don't properly handle cursor movement on
 * the edges of a NodeView, so we need to make the desired behavior explicit.
 *
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1252108
 */
export declare function nudgeCursorCmd(dir: -1 | 0 | 1): Command;
export declare const nudgeCursorForwardCmd: Command;
export declare const nudgeCursorBackCmd: Command;
