import {
  crypto_generichash,
  crypto_pwhash,
  crypto_pwhash_ALG_ARGON2ID13,
  crypto_pwhash_SALTBYTES,
} from "libsodium-wrappers";

export default class Password {
  static hash(password: string, salt: string): string {
    const saltBytes = crypto_generichash(crypto_pwhash_SALTBYTES, salt);
    const hash = crypto_pwhash(
      32,
      password,
      saltBytes,
      3, // operations limit
      1024 * 1024 * 64, // memory limit (8MB)
      crypto_pwhash_ALG_ARGON2ID13,
      "base64"
    );
    return hash;
  }
}
