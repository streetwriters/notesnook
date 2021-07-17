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
      p: "7px",
      px: 2,
      ":focus": {
        outline: "none",
      },
      ":focus-visible": {
        border: "2px solid",
        borderColor: "primary",
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
        border: "2px solid",
        borderColor: "text",
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
