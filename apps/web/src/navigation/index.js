import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Box, Flex, Heading } from "rebass";
import * as Icon from "react-feather";
import { ThemeProvider } from "../utils/theme";

export default class Navigator {
  constructor(root, routes, options = {}) {
    this.routes = routes;
    this.root = root;
    this.options = options;
    this.history = [];
    this.lastRoute = undefined;
  }

  getRoute(key) {
    return this.routes[key];
  }

  getRoot() {
    return document.querySelector(`.${this.root}`);
  }

  navigate(routeName, params = {}) {
    let route = this.getRoute(routeName);

    if (!route || this.lastRoute === route) {
      return false;
    }

    route.params = { ...route.params, ...params };

    if (this.lastRoute) {
      this.history.push(this.lastRoute);
    }
    this.lastRoute = route;

    return this.renderRoute(route);
  }

  renderRoute(route) {
    let root = this.getRoot();
    if (!root) {
      return false;
    }
    ReactDOM.render(
      <NavigationContainer
        navigator={this}
        route={route}
        params={route.params}
        canGoBack={this.options.backButtonEnabled && this.history.length > 0}
        backAction={() => this.goBack()}
      />,
      root
    );
    return true;
  }

  goBack() {
    let route = this.history.pop();

    if (!route) {
      return false;
    }

    return this.renderRoute(route);
  }
}

const NavigationContainer = props => {
  const [title, setTitle] = useState();
  useEffect(() => {
    const { title } = props.route.params;
    setTitle(props.route.title || title);
  }, [props.navigator, props.route]);
  return (
    <ThemeProvider>
      <Flex alignItems="center" px={3}>
        {props.canGoBack && (
          <Box
            onClick={props.backAction}
            height={42}
            color="fontPrimary"
            sx={{ marginLeft: -10 /*correction */ }}
          >
            <Icon.ChevronLeft size={42} />
          </Box>
        )}
        <Heading fontSize="heading">{title}</Heading>
      </Flex>
      {props.route.component && <props.route.component {...props.params} />}
    </ThemeProvider>
  );
};
