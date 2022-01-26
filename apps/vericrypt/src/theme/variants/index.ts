import ButtonFactory from "./button";
import InputFactory from "./input";
import TextFactory from "./text";

class VariantFactory {
  constructor() {
    return {
      buttons: new ButtonFactory(),
      forms: new InputFactory(),
      text: new TextFactory(),
    };
  }
}
export default VariantFactory;
