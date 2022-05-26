import { SxStyleProp } from "rebass";

const defaultVariant: SxStyleProp = {
  color: "text",
  fontFamily: "body",
};

const heading: SxStyleProp = {
  variant: "text.default",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "heading",
};

const title: SxStyleProp = {
  variant: "text.heading",
  fontSize: "title",
  fontWeight: "bold",
};

const subtitle: SxStyleProp = {
  variant: "text.heading",
  fontSize: "subtitle",
  fontWeight: "bold",
};

const body: SxStyleProp = { variant: "text.default", fontSize: "body" };

const subBody: SxStyleProp = {
  variant: "text.default",
  fontSize: "subBody",
  color: "fontTertiary",
};

const error: SxStyleProp = {
  variant: "text.default",
  fontSize: "subBody",
  color: "error",
};

export const textVariants = {
  default: defaultVariant,
  heading,
  title,
  subtitle,
  body,
  subBody,
  error,
};
