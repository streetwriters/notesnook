import {
  crypto_aead_xchacha20poly1305_ietf_decrypt,
  crypto_secretstream_xchacha20poly1305_init_pull,
  crypto_secretstream_xchacha20poly1305_pull,
  to_base64,
  from_base64,
  base64_variants,
  StateAddress,
  to_string,
} from "libsodium-wrappers";
import KeyUtils from "./keyutils";
import {
  Cipher,
  EncryptionKey,
  OutputFormat,
  Plaintext,
  SerializedKey,
} from "./types";

export default class Decryption {
  static decrypt(
    key: SerializedKey,
    cipherData: Cipher,
    outputFormat: OutputFormat = "text"
  ): Plaintext {
    if (!key.salt && cipherData.salt) key.salt = cipherData.salt;

    const encryptionKey = KeyUtils.transform(key);
    let input: Uint8Array = cipherData.cipher as Uint8Array;
    if (
      typeof cipherData.cipher === "string" &&
      cipherData.format === "base64"
    ) {
      input = from_base64(
        cipherData.cipher,
        base64_variants.URLSAFE_NO_PADDING
      );
    }

    const plaintext = crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      input,
      null,
      from_base64(cipherData.iv),
      encryptionKey.key
    );

    return {
      format: outputFormat,
      data:
        outputFormat === "base64"
          ? to_base64(plaintext, base64_variants.ORIGINAL)
          : outputFormat === "text"
          ? to_string(plaintext)
          : plaintext,
    };
  }

  static createStream(header: string, key: SerializedKey): DecryptionStream {
    return new DecryptionStream(header, KeyUtils.transform(key));
  }
}

class DecryptionStream {
  state: StateAddress;
  constructor(header: string, key: EncryptionKey) {
    this.state = crypto_secretstream_xchacha20poly1305_init_pull(
      from_base64(header),
      key.key
    );
  }

  read(chunk: Uint8Array): Uint8Array {
    const { message } = crypto_secretstream_xchacha20poly1305_pull(
      this.state,
      chunk,
      null
    );
    return message;
  }
}
