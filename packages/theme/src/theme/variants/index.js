import ButtonFactory from "./button";
import InputFactory from "./input";
import TextFactory from "./text";
import FlexFactory from "./flex";

class VariantFactory {
  constructor() {
    return {
      buttons: new ButtonFactory(),
      forms: new InputFactory(),
      text: new TextFactory(),
      variants: {
        ...new FlexFactory("row"),
        ...new FlexFactory("column")
      }
    };
  }
}
export default VariantFactory;
