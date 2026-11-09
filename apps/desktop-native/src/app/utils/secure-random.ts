export function isNativeSecureRandom(
  random: unknown = (globalThis as { crypto?: { getRandomValues?: unknown } })
    .crypto?.getRandomValues
) {
  if (typeof random !== "function") return false;
  return /\[native code\]/u.test(Function.prototype.toString.call(random));
}

export function assertSecureRandom() {
  if (!isNativeSecureRandom())
    throw new Error(
      "crypto.getRandomValues is missing or is not the native secure implementation; refusing to start because keys, salts and nonces depend on it."
    );
}
