import "@react-native-gpui/crypto";
import { AppRegistry } from "react-native";
import App from "./src/index";
import { name } from "./app.json";

AppRegistry.registerComponent(name, () => App);
