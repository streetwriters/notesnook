import Notebooks from "../../views/Notebooks";
import Topics from "../../views/Topics";
import Notes from "../../views/Notes";
import Navigator from "../index";
import { createRoute } from "../routes";

const routes = {
  ...createRoute("notebooks", Notebooks, { title: "Notebooks" }),
  ...createRoute("topics", Topics),
  ...createRoute("notes", Notes)
};
const NotebookNavigator = new Navigator("NotebookNavigator", routes, {
  backButtonEnabled: true
});
export default NotebookNavigator;
