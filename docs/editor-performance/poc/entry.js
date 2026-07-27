import { EditorState, TextSelection, AllSelection, Selection, Plugin, PluginKey } from "prosemirror-state";
import { EditorView, Decoration, DecorationSet, __serializeForClipboard } from "prosemirror-view";
import { Schema, DOMSerializer, DOMParser as PMDOMParser, Node as PMNode, Slice, Fragment } from "prosemirror-model";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, selectAll, toggleMark } from "prosemirror-commands";
import { history, undo, redo } from "prosemirror-history";
import { addListNodes } from "prosemirror-schema-list";
import { schema as basicSchema } from "prosemirror-schema-basic";

window.PM = {
  EditorState, TextSelection, AllSelection, Selection, Plugin, PluginKey,
  EditorView, Decoration, DecorationSet, serializeForClipboard: __serializeForClipboard,
  Schema, DOMSerializer, PMDOMParser, PMNode, Slice, Fragment,
  keymap, baseKeymap, selectAll, toggleMark,
  history, undo, redo,
  addListNodes, basicSchema
};
