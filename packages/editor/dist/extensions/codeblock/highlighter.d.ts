import { Plugin } from "prosemirror-state";
export declare function HighlighterPlugin({ name, defaultLanguage, }: {
    name: string;
    defaultLanguage: string | null | undefined;
}): Plugin<any, any>;
