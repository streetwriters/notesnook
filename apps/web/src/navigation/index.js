import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Home from "../views/Home";
import Notebooks from "../views/Notebooks";
import { ThemeProvider } from "emotion-theming";
import { Box, Flex, Heading } from "rebass";
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
    component: Notebooks,
    icon: Icon.Book
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
  const [title, setTitle] = useState(props.route.title);
  const [canGoBack, setCanGoBack] = useState(false);
  const [backAction, setBackAction] = useState();
  useEffect(() => {
    setTitle(props.route.title);
  }, [props.route.title]);
  return (
    <ThemeProvider theme={theme}>
      <Flex alignItems="center">
        <Box
          onClick={backAction}
          display={canGoBack ? "flex" : "none"}
          height={42}
          color="accent"
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
        />
      )}
    </ThemeProvider>
  );
}
