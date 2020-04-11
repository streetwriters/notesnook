import Crypto from "../crypto";

test("libsodium should load", async () => {
  const crypto = new Crypto();
  await crypto.init();
  expect(crypto.isReady).toBe(true);
});

test("crypto should throw if init has not been called", () => {
  const crypto = new Crypto();
  expect(() =>
    crypto.encrypt({ password: "i_am_a_password", data: "hello world" })
  ).toThrow();
});

test("encrypt should encrypt the data", async () => {
  const crypto = new Crypto();
  await crypto.init();
  const result = crypto.encrypt({
    password: "i_am_a_password",
    data: "hello world",
  });
  expect(result.cipher).not.toBe("hello world");
  expect(result.iv).toBeDefined();
  expect(result.salt).toBeDefined();
});

test("decrypt should result in plain text", async () => {
  const crypto = new Crypto();
  await crypto.init();
  const result = crypto.encrypt({
    password: "i_am_a_password",
    data: "hello world",
  });

  const decrypted = crypto.decrypt({
    password: "i_am_a_password",
    data: { ...result },
  });
  expect(decrypted).toBe("hello world");
});
