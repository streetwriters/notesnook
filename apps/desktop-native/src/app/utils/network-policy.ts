let disabled = false;

export function setNetworkDisabled(value: boolean) {
  disabled = value;
}

export function isNetworkDisabled() {
  return disabled;
}
