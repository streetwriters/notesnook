/**
 *
 * @param {number} size
 * @returns {Buffer}
 */
module.exports.randomBytes = function randomBytes(size) {
  if (!global.crypto || !crypto)
    throw new Error("Crypto is not supported on this platform.");
  if (crypto.randomBytes) return crypto.randomBytes(size);

  if (!crypto.getRandomValues)
    throw new Error(
      "Crypto.getRandomValues is not available on this platform."
    );

  const buffer = Buffer.allocUnsafe(size);
  crypto.getRandomValues(buffer);
  return buffer;
};

module.exports.randomInt = function () {
  const randomBuffer = module.exports.randomBytes(1);
  let randomNumber = randomBuffer[0] / 0xff; // / (0xffffffff + 1);

  return Math.floor(randomNumber * 0xffffff);
};
