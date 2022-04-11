class InputFactory {
  constructor() {
    return {
      input: new Default(),
      error: new Error(),
      clean: new Clean(),
    };
  }
}
export default InputFactory;

class Default {
  constructor() {
    return {
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
  }
}

class Clean {
  constructor() {
    return {
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
  }
}

class Error {
  constructor() {
    return {
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
  }
}
