import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Home from "../views/Home";
import Notebooks from "../views/Notebooks";
import Settings from "../views/Settings";
import Trash from "../views/Trash";
import { ThemeProvider } from "emotion-theming";
import { Box, Flex, Heading } from "rebass";
import * as Icon from "react-feather";
import theme from "../theme";
import Favorites from "../views/Favorites";

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
    component: Notebooks,
    icon: Icon.Book
  },
  favorites: {
    key: "favorites",
    title: "Favorites",
    component: Favorites,
    icon: Icon.Star
  },
  trash: {
    key: "trash",
    title: "Trash",
    component: Trash,
    icon: Icon.Trash
  },
  settings: {
    key: "settings",
    title: "Settings",
    component: Settings,
    icon: Icon.Settings,
    bottom: true
  }
};

const history = {};
export const navigationEvents = {
  onWillNavigateAway: undefined
};
var lastRoute = undefined;
export function navigate(routeName, root = "navigationView", params = {}) {
  let route = routes[routeName];

  // do not navigate if the previous route is the same
  if (!history[root]) {
    history[root] = [];
  }
  if (lastRoute === route) {
    return false;
  }

  if (
    navigationEvents.onWillNavigateAway &&
    !navigationEvents.onWillNavigateAway(routeName, params)
  ) {
    navigationEvents.onWillNavigateAway = undefined;
    return false;
  }

  let rootView = document.querySelector(`.${root}`);
  if (!rootView) return false;
  if (lastRoute) {
    history[root][history[root].length] = {
      ...lastRoute
    };
  }
  ReactDOM.render(<ThemedComponent route={route} params={params} />, rootView);
  lastRoute = route;
  return true;
}

export function goBack(root = "navigationView") {
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
  const [title, setTitle] = useState(props.route.title);
  const [canGoBack, setCanGoBack] = useState(false);
  const [backAction, setBackAction] = useState();
  useEffect(() => {
    setTitle(props.route.title);
  }, [props.route.title]);
  return (
    <ThemeProvider theme={theme}>
      <Flex alignItems="center" px={3}>
        <Box
          onClick={backAction}
          display={canGoBack ? "flex" : "none"}
          height={42}
          color="fontPrimary"
          sx={{ marginLeft: -10 /*correction */ }}
        >
          <Icon.ChevronLeft size={42} />
        </Box>
        <Heading fontSize="heading">{title}</Heading>
      </Flex>
      {props.route.component && (
        <props.route.component
          backAction={action => setBackAction(prev => action)}
          canGoBack={setCanGoBack}
          changeTitle={setTitle}
          {...props.params}
        />
      )}
    </ThemeProvider>
  );
}
