function areAllEmpty(obj) {
  const arrays = Object.values(obj).filter((v) => v && v.length !== undefined);
  return arrays.every((array) => array.length === 0);
}

export { areAllEmpty };
