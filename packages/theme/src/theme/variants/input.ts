import { InputProps } from "@rebass/forms";
import { SxProps, SxStyleProp } from "rebass";
import { Variants } from ".";

export function getInputVariants(): Variants {
  return {
    input: defaultVariant,
    error,
    clean,
  };
}

const defaultVariant: SxStyleProp = {
  borderRadius: "default",
  border: "none",
  // borderColor: "border",
  boxShadow: "0px 0px 0px 1px var(--border) inset",
  fontFamily: "body",
  fontWeight: "body",
  fontSize: "input",
  color: "text",
  outline: "none",
  ":focus": {
    boxShadow: "0px 0px 0px 1.5px var(--primary) inset",
  },
  ":hover:not(:focus)": {
    boxShadow: "0px 0px 0px 1px var(--dimPrimary) inset",
  },
};

const clean: SxStyleProp = {
  variant: "forms.input",
  outline: "none",
  boxShadow: "none",
  ":focus": {
    boxShadow: "none",
  },
  ":hover:not(:focus)": {
    boxShadow: "none",
  },
};

const error: SxStyleProp = {
  variant: "forms.input",
  boxShadow: "0px 0px 0px 1px var(--error) inset",
  outline: "none",
  ":focus": {
    boxShadow: "0px 0px 0px 1.5px var(--error) inset",
  },
  ":hover:not(:focus)": {
    boxShadow: "0px 0px 0px 1px var(--error) inset",
  },
};
