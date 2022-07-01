var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const loadedLanguages = {};
export function isLanguageLoaded(name) {
    return !!loadedLanguages[name];
}
export function loadLanguage(shortName) {
    return __awaiter(this, void 0, void 0, function* () {
        if (loadedLanguages[shortName])
            return loadedLanguages[shortName];
        const url = `https://esm.sh/refractor@4.7.0/lang/${shortName}.js?bundle=true`;
        const result = yield loadScript(shortName, url);
        loadedLanguages[shortName] = result;
        return result;
    });
}
function loadScript(id, url) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const callbackName = `on${id}Loaded`;
            const script = document.createElement("script");
            script.type = "module";
            script.innerHTML = `
    import LanguageDefinition from "${url}";
    if (window["${callbackName}"]) {
      window["${callbackName}"](LanguageDefinition)
    }
`;
            window[callbackName] = (lang) => {
                script.remove();
                window[callbackName] = null;
                resolve(lang);
            };
            // Append to the `head` element
            document.head.appendChild(script);
        });
    });
}
