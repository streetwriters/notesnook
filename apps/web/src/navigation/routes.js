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

export function createColorRoute(key, color) {
  return createRoute(key, undefined, { icon: Icon.Circle, color });
}

export function createNormalRoute(key, component, icon) {
  return createRoute(key, component, { title: component.name, icon });
}

export function createDeadRoute(key, icon, onClick) {
  return createRoute(key, undefined, { icon, onClick, isDead: true });
}

export function makeBottomRoute(route) {
  let key = Object.keys(route)[0];
  route[key].bottom = true;
  return route;
}
