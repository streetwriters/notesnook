export const getElevation = elevation => {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: {width: 0, height: 0.4 * elevation},
    shadowOpacity: 0.1,
    shadowRadius: 0.8 * elevation,
  };
};
