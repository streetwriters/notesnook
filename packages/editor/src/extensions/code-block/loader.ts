import { Syntax } from "refractor";

const loadedLanguages: Record<string, Syntax | undefined> = {};
export function isLanguageLoaded(name: string) {
  return !!loadedLanguages[name];
}
export async function loadLanguage(shortName: string) {
  if (loadedLanguages[shortName]) return loadedLanguages[shortName];

  const url = `https://esm.sh/refractor@4.7.0/lang/${shortName}.js?bundle=true`;
  const result = await loadScript(shortName, url);
  loadedLanguages[shortName] = result;
  return result;
}

async function loadScript(id: string, url: string) {
  return new Promise<Syntax>((resolve) => {
    const callbackName = `on${id}Loaded`;
    const script = document.createElement("script");
    script.type = "module";
    script.innerHTML = `
    import LanguageDefinition from "${url}";
    if (window["${callbackName}"]) {
      window["${callbackName}"](LanguageDefinition)
    }
`;
    (window as unknown as Record<string, unknown>)[callbackName] = (
      lang: Syntax
    ) => {
      script.remove();
      (window as unknown as Record<string, unknown>)[callbackName] = null;

      resolve(lang);
    };

    // Append to the `head` element
    document.head.appendChild(script);
  });
}
