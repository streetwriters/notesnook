/**
 * Quick & dirty script to download & transform all language details from
 * the PrismJS repo.
 */
require("isomorphic-fetch");

async function main() {
  const response = await fetch(
    `https://github.com/PrismJS/prism/raw/master/components.json`
  );
  if (!response.ok) return;
  const json = await response.json();
  let output = [];
  for (const key in json.languages) {
    if (key === "meta") continue;
    const language = json.languages[key];
    output.push({
      filename: key,
      title: language.title,
      alias: language.alias
        ? Array.isArray(language.alias)
          ? language.alias
          : [language.alias]
        : undefined,
    });
  }
  console.log(JSON.stringify(output));
}
main();
