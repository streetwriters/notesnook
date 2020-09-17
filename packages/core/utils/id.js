/**
 *
 * @param {number} size
 * @returns {Buffer}
 */
function randomBytes(size) {
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
}

function cryptoRandom(size, type) {
  return randomBytes(size).toString(type);
}

export default function () {
  return cryptoRandom(12, "hex");
}
