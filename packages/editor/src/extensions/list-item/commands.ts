import { ListItem as TiptapListItem } from "@tiptap/extension-list-item";
import { EditorState } from "prosemirror-state";
import { NodeType } from "prosemirror-model";
import { findParentNodeOfType, hasParentNodeOfType } from "prosemirror-utils";
import { Editor } from "@tiptap/core";

// WORKAROUND: if we're at the start of a list item, we need to either
// backspace directly to an empty list item above, or outdent this node
export function onBackspacePressed(
  editor: Editor,
  name: string,
  type: NodeType
) {
  const { selection } = editor.state;
  const { empty, $from } = selection;

  if (
    !empty ||
    !isInside(name, type, editor.state) ||
    $from.parentOffset !== 0 ||
    !isFirstChildOfParent(editor.state) ||
    !editor.can().liftListItem(type)
  )
    return false;

  const isEmpty = isListItemEmpty(type, editor.state);

  if (isFirstOfType(type, editor.state)) {
    return editor.commands.liftListItem(type);
  } else if (isEmpty) return editor.commands.deleteNode(type);
  else {
    // we have to run join backward twice because on the first join
    // the two list items are joined i.e., the editor just puts their
    // paragraphs next to each other. The next join merges the paragraphs
    // like it should be.
    return editor.chain().joinBackward().joinBackward().run();
  }
}

function isInside(name: string, type: NodeType, state: EditorState) {
  const { $from } = state.selection;

  let node = type || state.schema.nodes[name];
  const { paragraph } = state.schema.nodes;

  return (
    hasParentNodeOfType(node)(state.selection) &&
    $from.parent.type === paragraph
  );
}

function isFirstChildOfParent(state: EditorState): boolean {
  const { $from } = state.selection;
  return $from.depth > 1
    ? $from.parentOffset === 0 || $from.index($from.depth - 1) === 0
    : true;
}

const isFirstOfType = (type: NodeType, state: EditorState) => {
  const block = findParentNodeOfType(type)(state.selection);
  if (!block) return false;
  const { pos } = block;
  const resolved = state.doc.resolve(pos);
  return !resolved.nodeBefore;
};

function isListItemEmpty(type: NodeType, state: EditorState) {
  const block = findParentNodeOfType(type)(state.selection);
  if (!block) return false;
  const { node } = block;
  return !node.textContent.length;
}
