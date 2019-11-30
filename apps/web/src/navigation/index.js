import React from "react";
import ReactDOM from "react-dom";
import Home from "../views/Home";
import { ThemeProvider } from "emotion-theming";
import { Heading } from "rebass";
import * as Icon from "react-feather";
import theme from "../theme";

export const routes = {
  home: {
    key: "home",
    title: "Home",
    component: Home,
    icon: Icon.Home
  },
  notebooks: {
    key: "notebooks",
    title: "Notebooks",
    component: undefined,
    icon: Icon.Book
  },
  lists: {
    key: "lists",
    title: "Lists",
    component: undefined,
    icon: Icon.List
  },
  trash: {
    key: "trash",
    title: "Trash",
    component: undefined,
    icon: Icon.Trash
  },
  settings: {
    key: "settings",
    title: "Settings",
    component: undefined,
    icon: Icon.Settings
  }
};
const history = {};

export function navigate(routeName, root = "navigationView") {
  let route = routes[routeName];

  // do not navigate if the previous route is the same
  if (!history[root]) {
    history[root] = [];
  }
  let historyContainer = history[root];
  if (
    historyContainer.length > 0 &&
    historyContainer[historyContainer.length - 1].title === route.title
  ) {
    return;
  }

  let rootView = document.querySelector(`.${root}`);
  if (!rootView) return;
  ReactDOM.render(<ThemedComponent route={route} />, rootView);

  historyContainer[historyContainer.length] = {
    ...route
  };
  history[root] = historyContainer;
}

export function goBack(root) {
  if (!history[root] || history[root].length <= 0) {
    return;
  }
  let route = history[root].pop();
  if (route) {
    let rootView = document.querySelector(`.${root}`);
    if (!rootView) return;
    ReactDOM.render(<ThemedComponent route={route} />, rootView);
  }
}

function ThemedComponent(props) {
  return (
    <ThemeProvider theme={theme}>
      <Heading fontSize="heading">{props.route.title}</Heading>
      {props.route.component && props.route.component()}
    </ThemeProvider>
  );
}
