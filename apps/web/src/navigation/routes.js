import NavigationContainer from "./container";

export function createRoute(key, component, props = {}, params = {}) {
  return {
    [key]: {
      key,
      component,
      ...props,
      params,
    },
  };
}

export function createNavigatorRoute(key, icon, title, navigator) {
  return createRoute(key, NavigationContainer, { icon, title }, { navigator });
}

export function createNormalRoute(key, component, icon, props = {}) {
  return createRoute(key, component, { title: component.name, icon, ...props });
}

export function createDeadRoute(key, icon, props = {}) {
  return createRoute(key, undefined, { icon, ...props });
}
