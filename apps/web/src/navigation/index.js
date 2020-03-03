import React from "react";
import ReactDOM from "react-dom";
import { Box, Flex, Heading, Text } from "rebass";
import * as Icon from "react-feather";
import { ThemeProvider } from "../utils/theme";
import { useStore, store } from "../stores/app-store";

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

    // exit selection mode on navigate
    store.getState().exitSelectionMode();

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
    this.lastRoute = route;
    return this.renderRoute(route);
  }

  restore() {
    if (!this.lastRoute) {
      return false;
    }
    return this.renderRoute(this.lastRoute);
  }
}

const NavigationContainer = props => {
  const openSideMenu = useStore(store => store.openSideMenu);
  const isSelectionMode = useStore(store => store.isSelectionMode);
  const exitSelectionMode = useStore(store => store.exitSelectionMode);
  return (
    <ThemeProvider>
      <Flex flexDirection="column" px={2}>
        {(props.route.title || props.route.params.title) && (
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center" py={2}>
              {props.canGoBack && (
                <Box
                  onClick={props.backAction}
                  height={38}
                  color="fontPrimary"
                  sx={{ marginLeft: -2 /*correction */, marginRight: 2 }}
                >
                  <Icon.ChevronLeft size={38} />
                </Box>
              )}
              <Box
                onClick={openSideMenu}
                height={38}
                color="fontPrimary"
                sx={{
                  marginLeft: -5 /*correction */,
                  marginRight: 1,
                  display: ["block", "none", "none"]
                }}
              >
                <Icon.Menu size={38} />
              </Box>
              <Heading
                fontSize="heading"
                color={props.route.titleColor || "text"}
              >
                {props.route.title || props.route.params.title}
              </Heading>
            </Flex>
            {props.route.options && isSelectionMode && (
              <Flex>
                {props.route.options.map(option => (
                  <Box
                    onClick={option.onClick}
                    mx={2}
                    sx={{ cursor: "pointer" }}
                  >
                    <option.icon />
                  </Box>
                ))}
              </Flex>
            )}
          </Flex>
        )}
        {(props.route.params.subtitle || isSelectionMode) && (
          <Text
            variant="title"
            color="primary"
            onClick={() => exitSelectionMode()}
            sx={{
              marginBottom: 2,
              cursor: isSelectionMode ? "pointer" : "normal"
            }}
          >
            {props.route.params.subtitle}
            {isSelectionMode && "\nUnselect All"}
          </Text>
        )}
      </Flex>
      {props.route.component && (
        <props.route.component navigator={props.navigator} {...props.params} />
      )}
    </ThemeProvider>
  );
};
