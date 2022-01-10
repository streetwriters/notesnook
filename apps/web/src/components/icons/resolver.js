const { toTitleCase, toCamelCase } = require("../../utils/string");

var icons = undefined;
export function getIconFromAlias(alias) {
  if (!alias) return;

  const iconName = toTitleCase(toCamelCase(alias));
  if (!icons) icons = require("./index");
  return icons[iconName];
}
