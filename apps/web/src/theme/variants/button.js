class ButtonFactory {
  constructor() {
    return {
      default: new Default(),
      primary: new Primary(),
      secondary: new Secondary(),
      tertiary: new Tertiary(),
      list: new List(),
      anchor: new Anchor(),
      tool: new Tool(),
      icon: new Icon(),
      shade: new Shade(),
      statusitem: new StatusItem(),
    };
  }
}
export default ButtonFactory;

class Default {
  constructor() {
    return {
      bg: "transparent",
      fontFamily: "body",
      fontWeight: "body",
      fontSize: "body",
      borderRadius: "default",
      cursor: "pointer",
      p: 2,
      px: 2,
      transition: "filter 200ms ease-in",
      ":hover": {
        filter: "brightness(90%)",
      },
      ":active": {
        filter: "brightness(110%)",
      },
      ":focus:not(:active), :focus-within:not(:active), :focus-visible:not(:active)":
        {
          outline: "none",
          boxShadow: "0px 0px 0px 2px var(--primary)",
        },
      ":disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    };
  }
}

class Primary {
  constructor() {
    return {
      variant: "buttons.default",
      color: "static",
      bg: "primary",
      px: 4,
      ":focus-visible": {
        boxShadow: "0px 0px 0px 2px var(--text)",
      },
    };
  }
}

class Shade {
  constructor() {
    return { variant: "buttons.primary", color: "primary", bg: "shade" };
  }
}

class Secondary {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      bg: "border",
      ":hover:not(:disabled)": { bg: "hover", filter: "brightness(90%)" },
    };
  }
}

class Tertiary {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      bg: "transparent",
      border: "2px solid",
      borderColor: "border",
      ":hover": {
        borderColor: "primary",
      },
    };
  }
}

class List {
  constructor() {
    return {
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
  }
}

class Anchor {
  constructor() {
    return {
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
  }
}

class Icon {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      borderRadius: "none",
      ":hover": {
        backgroundColor: "hover",
        filter: "brightness(90%)",
      },
    };
  }
}

class Tool {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      py: 1,
      backgroundColor: "bgSecondary",
      borderRadius: "default",
      ":hover": {
        backgroundColor: "hover",
      },
    };
  }
}

class StatusItem {
  constructor() {
    return {
      variant: "buttons.icon",
      p: 0,
      py: 1,
      px: 1,
    };
  }
}
