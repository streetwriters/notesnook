import { Plugin } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
export declare function HighlighterPlugin({ name, defaultLanguage, }: {
    name: string;
    defaultLanguage: string | null | undefined;
}): Plugin<DecorationSet>;
