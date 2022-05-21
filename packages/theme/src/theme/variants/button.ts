import { SxStyleProp } from "rebass";
import { Variants } from ".";

export function getButtonVariants(): Variants {
  return {
    default: defaultVariant,
    primary,
    secondary,
    tertiary,
    list,
    anchor,
    tool,
    icon,
    dialog,
    statusitem: statusItem,
    menuitem: menuItem,
  };
}

const defaultVariant: SxStyleProp = {
  bg: "transparent",
  fontFamily: "body",
  fontWeight: "body",
  fontSize: "body",
  borderRadius: "default",
  cursor: "pointer",
  p: 2,
  py: "7.5px",
  transition: "filter 200ms ease-in, box-shadow 200ms ease-out",
  ":hover:not(:disabled)": {
    filter: "brightness(90%)",
  },
  ":active": {
    filter: "brightness(98%)",
  },
  outline: "none",
  ":focus-visible:not(:active)": {
    filter: "brightness(90%)",
    bg: "bgSecondary",
  },
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

const primary: SxStyleProp = {
  variant: "buttons.default",
  color: "static",
  bg: "primary",
};

const dialog: SxStyleProp = {
  variant: "buttons.primary",
  color: "primary",
  fontWeight: "bold",
  bg: "transparent",
  ":hover": { bg: "bgSecondary" },
  ":focus:not(:active), :focus-within:not(:active), :focus-visible:not(:active)":
    {
      bg: "hover",
      filter: "brightness(90%)",
    },
  ":disabled": {
    opacity: 0.7,
    cursor: "not-allowed",
  },
};

const secondary: SxStyleProp = {
  variant: "buttons.default",
  color: "text",
  bg: "border",
};

const tertiary: SxStyleProp = {
  variant: "buttons.default",
  color: "text",
  bg: "transparent",
  border: "2px solid",
  borderColor: "border",
  ":hover": {
    borderColor: "primary",
  },
};

const list: SxStyleProp = {
  variant: "buttons.tertiary",
  border: "0px solid",
  borderBottom: "1px solid",
  borderBottomColor: "border",
  borderRadius: 0,
  textAlign: "left",
  py: 2,
  px: 0,
  cursor: "pointer",
  ":hover": {
    borderBottomColor: "primary",
  },
};

const anchor: SxStyleProp = {
  variant: "buttons.default",
  color: "primary",
  fontSize: "subBody",
  p: 0,
  m: 0,
  px: 0,
  py: 0,
  ":hover": {
    textDecoration: "underline",
  },
};

const icon: SxStyleProp = {
  variant: "buttons.default",
  color: "text",
  borderRadius: "none",
  ":hover": {
    backgroundColor: "hover",
    filter: "brightness(90%)",
  },
};

const tool: SxStyleProp = {
  variant: "buttons.default",
  color: "text",
  backgroundColor: "bgSecondary",
  borderRadius: "default",
  ":hover": {
    backgroundColor: "hover",
  },
};

const statusItem: SxStyleProp = {
  variant: "buttons.icon",
  p: 0,
  py: 1,
  px: 1,
};

const menuItem: SxStyleProp = {
  variant: "buttons.default",
  // bg: "transparent",
  py: "8px",
  px: 3,
  borderRadius: 0,
  color: "text",
  cursor: "pointer",
  ":hover:not(:disabled),:focus:not(:disabled)": {
    backgroundColor: "hover",
    boxShadow: "none",
  },
  ":active:not(:disabled)": {
    backgroundColor: "border",
  },
};
