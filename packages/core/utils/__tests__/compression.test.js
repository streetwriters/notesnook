import { TEST_NOTE } from "../../__tests__/utils";
import { compress, decompress } from "../compression";

test("String should compress and decompress", () => {
  let compressed = compress(TEST_NOTE.content.data);
  expect(compressed).not.toBe(TEST_NOTE.content.data);

  let decompressed = decompress(compressed);
  expect(decompressed).toBe(TEST_NOTE.content.data);
});
