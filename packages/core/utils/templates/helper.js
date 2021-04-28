import { formatDate } from "../date";

function generateMetaTags(metadata, createMetaTag) {
  let metaTags = [];
  for (let key in metadata) {
    let value = metadata[key];
    if (typeof value === "object" && !Array.isArray(value)) continue;
    else if (Array.isArray(value)) value = value.join(", ");

    // we must have no new line characters
    if (typeof value === "string") value = value.replace(/\r?\n|\r/g, "");

    metaTags.push(createMetaTag(key, value));
  }
  return metaTags;
}

export function buildPage(
  template,
  createMetaTag,
  { metadata, title, headline, content, createdOn, editedOn }
) {
  let page = template;

  if (createMetaTag)
    page = page.replace(
      /{{metaTags}}/g,
      generateMetaTags(metadata, createMetaTag).join("\n")
    );

  page = page.replace(/{{title}}/g, title);
  page = page.replace(/{{headline}}/g, headline);
  page = page.replace(/{{content}}/g, content);
  page = page.replace(/{{createdOn}}/g, formatDate(createdOn));
  page = page.replace(/{{editedOn}}/g, formatDate(editedOn));
  return page;
}
