import { Plugin } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import { AddMarkStep, RemoveMarkStep, ReplaceAroundStep, ReplaceStep } from "prosemirror-transform";
export declare type MergedStep = AddMarkStep | RemoveMarkStep | ReplaceAroundStep | ReplaceStep;
export declare function HighlighterPlugin({ name, defaultLanguage, }: {
    name: string;
    defaultLanguage: string | null | undefined;
}): Plugin<DecorationSet>;
