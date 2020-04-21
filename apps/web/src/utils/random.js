function getRandom(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
export { getRandom, getRandomArbitrary };
