class TextFactory {
  constructor() {
    return {
      default: new Default(),
      heading: new Heading(),
      title: new Title(),
      body: new Body()
    };
  }
}
export default TextFactory;

class Default {
  constructor() {
    return {
      color: "text",
      fontFamily: "body"
    };
  }
}

class Heading {
  constructor() {
    return {
      variant: "text.default",
      fontFamily: "heading",
      fontWeight: "bold",
      fontSize: "heading"
    };
  }
}

class Title {
  constructor() {
    return {
      variant: "text.heading",
      fontSize: "title"
    };
  }
}

class Body {
  constructor() {
    return { variant: "text.default", fontWeight: "body", fontSize: "body" };
  }
}
