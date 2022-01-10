const ATTRIBUTE_DELETE_FILTERS = [
  "[data-mce-selected]",
  "[data-mce-active]",
  "[data-mce-src]",
  "[data-mce-style]",
  "[data-mce-type]",
  "[data-progress]",
];
const ELEMENT_DELETE_FILTERS = [];
const ELEMENT_MODIFY_FILTERS = ["img[src]"];

export const QUERY = [
  ...ATTRIBUTE_DELETE_FILTERS,
  ...ELEMENT_DELETE_FILTERS,
  ...ELEMENT_MODIFY_FILTERS,
].join(",");

export const ATTRIBUTES = {
  strip: [
    "data-mce-selected",
    "data-mce-src",
    "data-mce-style",
    "data-mce-type",
    "data-progress",
    "data-mce-active",
  ],
  elementDelete: ["data-mce-bookmark"],
};
