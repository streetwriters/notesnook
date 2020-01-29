import * as Icon from "react-feather";

export function createRoute(key, component, props = {}, params = {}) {
  return {
    [key]: {
      key,
      component,
      ...props,
      params
    }
  };
}

export function createColorRoute(key, color, props = {}) {
  return createRoute(key, undefined, { icon: Icon.Circle, color, ...props });
}

export function createNormalRoute(key, component, icon, props = {}) {
  return createRoute(key, component, { title: component.name, icon, ...props });
}

export function createDeadRoute(key, icon, props = {}) {
  return createRoute(key, undefined, { icon, ...props });
}
