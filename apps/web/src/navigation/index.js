import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Box, Flex, Heading } from "rebass";
import * as Icon from "react-feather";
import { ThemeProvider } from "../utils/theme";

var lastRoute;
export default class Navigator {
  constructor(root, routes) {
    this.routes = routes;
    this.root = root;
    this.history = [];
  }

  getRoute(key) {
    return this.routes[key];
  }

  getRoot() {
    return document.querySelector(`.${this.root}`);
  }

  navigate(routeName, params = {}) {
    let route = this.getRoute(routeName);

    if (!route || lastRoute === route) {
      return false;
    }

    route.params = { ...route.params, ...params };

    if (lastRoute) {
      this.history.push(lastRoute);
    }
    lastRoute = route;

    return this.renderRoute(route);
  }

  renderRoute(route) {
    let root = this.getRoot();
    if (!root) {
      return false;
    }
    ReactDOM.render(
      <NavigationContainer route={route} params={route.params} />,
      root
    );
    return true;
  }

  goBack() {
    let route = this.history.pop();
    if (!route) {
      return false;
    }
    this.navigate(route.key, route.params);
    this.history.pop(); //remove the route
    return true;
  }
}

const NavigationContainer = props => {
  const [title, setTitle] = useState();
  const [canGoBack, setCanGoBack] = useState(false);
  const [backAction, setBackAction] = useState();
  useEffect(() => {
    setTitle(props.route.title || props.route.params.title);
  }, [props.route.title, props.route.params]);
  return (
    <ThemeProvider>
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
          backAction={action => setBackAction(() => action)}
          canGoBack={setCanGoBack}
          changeTitle={setTitle}
          {...props.params}
        />
      )}
    </ThemeProvider>
  );
};
