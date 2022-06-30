import { Command } from "prosemirror-state";
import { NodeType } from "prosemirror-model";
/**
 * Returns a new command that can be used to inserts a new math node at the
 * user's current document position, provided that the document schema actually
 * allows a math node to be placed there.
 *
 * @param mathNodeType An instance for either your math_inline or math_display
 *     NodeType.  Must belong to the same schema that your EditorState uses!
 * @param initialText (optional) The initial source content for the math editor.
 */
export declare function insertMathCmd(mathNodeType: NodeType, initialText?: string): Command;
