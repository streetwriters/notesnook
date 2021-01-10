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
      ":focus": {
        outline: "none",
        opacity: 0.8,
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
      transition: "opacity 300ms linear",
      ":hover": {
        opacity: 0.8,
      },
    };
  }
}

class Secondary {
  constructor() {
    return { variant: "buttons.default", color: "text", bg: "border" };
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
        backgroundColor: "shade",
      },
    };
  }
}

class Tool {
  constructor() {
    return {
      variant: "buttons.default",
      color: "text",
      p: 1,
      px: 2,
      borderRadius: "default",
      ":hover": {
        backgroundColor: "bgSecondary",
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
