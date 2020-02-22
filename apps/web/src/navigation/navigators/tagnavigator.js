import { Notes, Tags } from "../../views";
import Navigator from "../index";
import { createRoute } from "../routes";

const routes = {
  ...createRoute("tags", Tags, { title: "Tags" }),
  ...createRoute("notes", Notes)
};
const TagNavigator = new Navigator("TagNavigator", routes, {
  backButtonEnabled: true
});
export default TagNavigator;
