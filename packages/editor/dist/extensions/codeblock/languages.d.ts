import hljs from "highlight.js/lib/core";
import { Language } from "highlight.js";
export { hljs };
export declare function loadLanguage(shortName: string): Promise<Language | undefined>;
export declare const LANGUAGES: ({
    name: string;
    shortname: string;
    aliases: string[];
} | {
    name: string;
    shortname: string;
    aliases?: undefined;
})[];
