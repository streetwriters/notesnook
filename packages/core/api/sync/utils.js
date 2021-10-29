function areAllEmpty(obj) {
  for (let key in obj) {
    const value = obj[key];
    if (Array.isArray(value) && value.length > 0) return false;
  }
  return true;
}

export { areAllEmpty };
