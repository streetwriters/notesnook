import React from "react";
import ReactDOM from "react-dom";
import { Box, Flex, Heading, Text } from "rebass";
import Animated from "../components/animated";
import { AnimatePresence } from "framer-motion";
import * as Icon from "../components/icons";
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

  navigate(routeName, params = {}, force = false) {
    let route = this.getRoute(routeName);

    if (!force && (!route || this.lastRoute === route)) {
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
      <AnimatePresence exitBeforeEnter={true}>
        <Animated.Flex
          key={route.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          exit={{ opacity: 0 }}
          flexDirection="column"
          flex="1 1 auto"
        >
          <NavigationContainer
            navigator={this}
            route={route}
            params={route.params}
            canGoBack={
              this.options.backButtonEnabled && this.history.length > 0
            }
            backAction={() => this.goBack()}
          />
        </Animated.Flex>
      </AnimatePresence>,
      root
    );
    return true;
  }

  goBack(params = {}) {
    let route = this.history.pop();
    if (!route) {
      return false;
    }
    this.lastRoute = route;
    return this.renderRoute(this._mergeParams(route, params));
  }

  restore(params = {}) {
    if (!this.lastRoute) {
      return false;
    }
    return this.renderRoute(this._mergeParams(this.lastRoute, params));
  }

  _mergeParams(route, params) {
    return {
      ...route,
      params: { ...route.params, ...params }
    };
  }
}

const NavigationContainer = props => {
  const openSideMenu = useStore(store => store.openSideMenu);
  const isSelectionMode = useStore(store => store.isSelectionMode);
  const exitSelectionMode = useStore(store => store.exitSelectionMode);
  const selectAll = useStore(store => store.selectAll);
  return (
    <ThemeProvider>
      <Flex flexDirection="column" px={2}>
        {(props.route.title || props.route.params.title) && (
          <>
            <Flex alignItems="center" justifyContent="space-between">
              <Flex alignItems="center" py={2}>
                {props.canGoBack && (
                  <Box
                    onClick={props.backAction}
                    ml={-5}
                    height={38}
                    width={38}
                  >
                    <Icon.ChevronLeft size={38} color="fontPrimary" />
                  </Box>
                )}
                <Box
                  onClick={openSideMenu}
                  height={38}
                  ml={-5}
                  sx={{
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
                      key={option.icon.name}
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
            {props.route.params.subtitle && (
              <Text
                variant="title"
                color="primary"
                sx={{
                  marginBottom: 2,
                  cursor: isSelectionMode ? "pointer" : "normal"
                }}
              >
                {props.route.params.subtitle}
              </Text>
            )}
            {isSelectionMode && (
              <Flex alignItems="center" mb={2} sx={{ cursor: "pointer" }}>
                <Text
                  variant="title"
                  color="primary"
                  onClick={() => selectAll()}
                >
                  Select all
                </Text>
                <Text
                  ml={2}
                  variant="title"
                  color="primary"
                  onClick={() => exitSelectionMode()}
                >
                  Unselect
                </Text>
              </Flex>
            )}
          </>
        )}
      </Flex>
      {props.route.component && (
        <props.route.component navigator={props.navigator} {...props.params} />
      )}
    </ThemeProvider>
  );
};
