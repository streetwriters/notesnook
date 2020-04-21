import Editor from "../../components/editor";
import SplitEditor from "../../components/spliteditor";
import Navigator from "../index";
import { createRoute } from "../routes";

const routes = {
  ...createRoute("editor", Editor),
  ...createRoute("split", SplitEditor),
};

const EditorNavigator = new Navigator("EditorNavigator", routes, {
  defaultRoute: "editor",
});
export default EditorNavigator;
