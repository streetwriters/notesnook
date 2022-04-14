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
      border: "2px solid var(--border)",
      fontFamily: "body",
      fontWeight: "body",
      fontSize: "input",
      color: "text",
      outline: "none",
      ":focus": {
        border: "2px solid var(--primary)",
      },
      ":hover:not(:focus)": {
        border: "2px solid var(--dimPrimary)",
      },
    };
  }
}

class Clean {
  constructor() {
    return {
      variant: "forms.input",
      outline: "none",
      border: "none",
      ":focus": {
        border: "none",
      },
      ":hover:not(:focus)": {
        border: "none",
      },
    };
  }
}

class Error {
  constructor() {
    return {
      variant: "forms.input",
      border: "2px solid var(--error)",
      outline: "none",
      ":focus": {
        border: "2px solid var(--error)",
      },
      ":hover:not(:focus)": {
        border: "2px solid var(--errorBg)",
      },
    };
  }
}
