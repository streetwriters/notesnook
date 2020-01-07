export const slideRight = {
  0: {
    transform: [{translateX: -4}],
  },
  0.5: {
    transform: [{translateX: 0}],
  },
  1: {
    transform: [{translateX: 4}],
  },
};
export const slideLeft = {
  0: {
    transform: [{translateX: 4}],
  },
  0.5: {
    transform: [{translateX: 0}],
  },
  1: {
    transform: [{translateX: -4}],
  },
};

export const rotate = {
  0: {
    transform: [{rotateZ: '0deg'}, {translateX: 0}, {translateY: 0}],
  },
  0.5: {
    transform: [{rotateZ: '25deg'}, {translateX: 10}, {translateY: -20}],
  },
  1: {
    transform: [{rotateZ: '45deg'}, {translateX: 10}, {translateY: -20}],
  },
};

export const deleteItems = (tX, tY) => {
  return {
    0: {
      transform: [{translateX: tX}, {translateY: tY}],
    },
    0.3: {
      transform: [{translateX: 0}, {translateY: 0}],
    },
    0.5: {
      transform: [{translateX: 0}, {translateY: 50}],
    },
    1: {
      transform: [{translateX: 0}, {translateY: 110}],
    },
  };
};

export const opacity = {
  0: {
    opacity: 0,
  },

  1: {
    opacity: 1,
  },
};
