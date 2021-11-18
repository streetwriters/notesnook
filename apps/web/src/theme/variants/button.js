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
      menuitem: new MenuItem(),
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
        boxShadow: "0px 0px 0px 2px var(--text)",
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

class MenuItem {
  constructor() {
    return {
      bg: "transparent",
      py: "8px",
      px: 3,
      borderRadius: 0,
      color: "text",
      cursor: "pointer",
      ":hover:not(:disabled)": {
        backgroundColor: "hover",
      },
      ":active:not(:disabled)": {
        backgroundColor: "border",
      },
    };
  }
}
