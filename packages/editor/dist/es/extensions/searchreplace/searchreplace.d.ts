import { Extension } from "@tiptap/core";
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        searchreplace: {
            startSearch: () => ReturnType;
            endSearch: () => ReturnType;
            search: (term: string, options?: SearchSettings) => ReturnType;
            moveToNextResult: () => ReturnType;
            moveToPreviousResult: () => ReturnType;
            replace: (term: string) => ReturnType;
            replaceAll: (term: string) => ReturnType;
        };
    }
}
interface Result {
    from: number;
    to: number;
}
interface SearchOptions {
    searchResultClass: string;
}
interface SearchSettings {
    matchCase: boolean;
    enableRegex: boolean;
    matchWholeWord: boolean;
}
export declare type SearchStorage = SearchSettings & {
    searchTerm: string;
    selectedIndex: number;
    isSearching: boolean;
    selectedText?: string;
    results?: Result[];
};
export declare const SearchReplace: Extension<SearchOptions, SearchStorage>;
export {};
