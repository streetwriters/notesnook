import Editor from "../../components/editor";
import Navigator from "../index";
import { createRoute } from "../routes";

const routes = {
  ...createRoute("editor", Editor)
};

const EditorNavigator = new Navigator("EditorNavigator", routes, {
  backButtonEnabled: false
});
export default EditorNavigator;
