import React from "react";
import ReactDOM from "react-dom";
import Animated from "../components/animated";
import { AnimatePresence } from "framer-motion";
import { store as selectionStore } from "../stores/selection-store";
import Route from "./route";
import Config from "../utils/config";

class Navigator {
  constructor(root, routes, options = {}) {
    this.routes = routes;
    this.root = root;
    this.options = options;
    this.history = [];
    this.lastRoute = undefined;
  }

  onLoad = () => {
    const route = Config.get(this.root, this.getRoute(this.options.default));
    this.navigate(route.key, route.params, true);
  };

  getRoute(key) {
    return this.routes[key];
  }

  setLastRoute(route) {
    this.lastRoute = route;
    // cache the route in localStorage
    // NOTE: we delete the navigator key if any so it's always new across refreshes
    const copy = { ...route, params: { ...route.params } };
    if (copy.params.navigator) delete copy.params.navigator;
    Config.set(this.root, copy);
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
    this.setLastRoute(route);
    return this.renderRoute(route);
  }

  renderRoute(route) {
    let root = this.getRoot();
    if (!root) {
      return false;
    }
    // exit selection mode on navigate
    selectionStore.toggleSelectionMode(false);
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
          <Route
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
    this.setLastRoute(route);
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
      params: { ...route.params, ...params },
    };
  }
}
export default Navigator;
