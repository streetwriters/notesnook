class InputFactory {
  constructor() {
    return {
      default: new Default(),
      error: new Error()
    };
  }
}
export default InputFactory;

class Default {
  constructor() {
    return {
      borderRadius: "default",
      border: "2px solid",
      borderColor: "border",
      fontFamily: "body",
      fontWeight: "body",
      fontSize: "input",
      ":focus": {
        outline: "none",
        borderColor: "primary"
      },
      ":hover": {
        borderColor: "shade"
      }
    };
  }
}

class Error {
  constructor() {
    return {
      variant: "forms.default",
      borderColor: "red",
      ":focus": {
        outline: "none",
        borderColor: "red"
      },
      ":hover": {
        borderColor: "darkred"
      }
    };
  }
}
