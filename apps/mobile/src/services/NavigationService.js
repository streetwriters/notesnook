import { createAppContainer, NavigationActions } from "react-navigation";
import {createStackNavigator} from "react-navigation-stack";
import Home from "../views/Home/index";

const TopLevelNavigator = createStackNavigator(
    {
      Home: {
        screen: Home
      }
    },
    {
      initialRouteName: "Home"
    }
  );

export const AppContainer = createAppContainer(TopLevelNavigator);

let _navigator;

function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

function navigate(routeName, params) {
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params
    })
  );
}

// add other navigation functions that you need and export them

export default {
  navigate,
  setTopLevelNavigator
};