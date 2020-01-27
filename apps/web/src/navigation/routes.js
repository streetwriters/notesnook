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
  //console.log(component.name);
  return createRoute(key, component, { title: component.name, icon });
}
