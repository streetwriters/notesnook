import { describe, expect, test } from "vitest";
import { isNativeSecureRandom } from "./secure-random";

describe("secure random check", () => {
  test("a missing implementation is rejected", () => {
    expect(isNativeSecureRandom(undefined)).toBe(false);
  });

  test("a script implementation backed by Math.random is rejected", () => {
    const polyfill = (array: Uint8Array) => {
      for (let index = 0; index < array.length; index++)
        array[index] = Math.floor(Math.random() * 256);
      return array;
    };
    expect(isNativeSecureRandom(polyfill)).toBe(false);
  });

  test("a native function is accepted", () => {
    expect(isNativeSecureRandom(Math.random)).toBe(true);
  });
});
