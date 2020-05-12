import React from "react";
import ReactDOM from "react-dom";
import Animated from "../components/animated";
import { AnimatePresence } from "framer-motion";
import { store as selectionStore } from "../stores/selection-store";
import { store as appStore } from "../stores/app-store";
import Route from "./route";
import Config from "../utils/config";
import { isMobile } from "../utils/dimensions";

class Navigator {
  constructor(root, routes, options = {}) {
    this.routes = routes;
    this.root = root;
    this.options = options;
    this.history = [];
    this.lastRoute = undefined;
    this.onNavigate = () => {};
  }

  onLoad = () => {
    if (!this.options.persist) return;

    const opts = Config.get(this.root, {
      history: [],
      lastRoute: this.getRoute(this.options.default),
    });
    this.history = opts.history;
    this.lastRoute = undefined;
    this.navigate(opts.lastRoute.key, opts.lastRoute.params, true);
  };

  getRoute(key) {
    return this.routes[key];
  }

  pushToHistory() {
    const lastItem = this.history[this.history.length - 1];
    if (this.lastRoute) {
      if (lastItem && lastItem.key === this.lastRoute.key) return;
      this.history.push(this.lastRoute);
    }
  }

  setLastRoute(route) {
    if (!this.options.persist) return;

    this.lastRoute = route;
    // cache the route in localStorage
    // NOTE: we delete the navigator key if any so it's always new across refreshes
    const copy = { ...route, params: { ...route.params } };
    if (copy.params.navigator) delete copy.params.navigator;
    Config.set(this.root, {
      history: this.history,
      lastRoute: copy,
    });
  }

  getRoot() {
    return document.querySelector(`.${this.root}`);
  }

  getNavigationRoute(routeName, params = {}, force = false) {
    let route = this.getRoute(routeName);

    this.onNavigate(route);

    if (!force && (!route || this.lastRoute === route)) {
      return false;
    }

    route.params = { ...route.params, ...params };

    this.pushToHistory();
    this.setLastRoute(route);
    return route;
  }

  navigate(routeName, params = {}, force = false) {
    const route = this.getNavigationRoute(routeName, params, force);
    if (!route) return false;
    return this.renderRoute(route);
  }

  navigateWithResult(routeName, params = {}, force = false) {
    return new Promise((resolve) => {
      const route = this.getNavigationRoute(routeName, params, force);
      if (!route) return false;
      this.renderRoute(route, resolve);
    });
  }

  renderRoute(route, onDone = null) {
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
            onDone={onDone}
            backAction={() => this.goBack()}
          />
        </Animated.Flex>
      </AnimatePresence>,
      root
    );
    if (isMobile()) appStore.toggleSideMenu(false);
    return true;
  }

  goBack(params = {}) {
    let route = this.history.pop();
    if (!route) return false;
    if (!route.component) route.component = this.getRoute(route.key).component;

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
