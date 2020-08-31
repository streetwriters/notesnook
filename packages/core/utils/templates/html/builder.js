import HTMLTemplate from "./template";

function createMetaTag(name, content) {
  return `<meta name="nn-${name}" content="${content}">`;
}

function generateMetaTags(metadata) {
  let metaTags = [];
  for (let key in metadata) {
    let value = metadata[key];
    if (typeof value === "object" && !Array.isArray(value)) continue;
    else if (Array.isArray(value)) value = value.join(", ");
    metaTags.push(createMetaTag(key, value));
  }
  return metaTags;
}

function buildHTML({ metadata, title, content, createdOn, editedOn }) {
  let page = HTMLTemplate;
  page = page.replace(/{{metaTags}}/g, generateMetaTags(metadata).join("\n"));
  page = page.replace(/{{title}}/g, title);
  page = page.replace(/{{content}}/g, content);
  page = page.replace(/{{createdOn}}/g, formatDate(createdOn));
  page = page.replace(/{{editedOn}}/g, formatDate(editedOn));
  return page;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    second: "2-digit",
  });
}

export default { buildHTML };
