import { IMG_CONTENT, IMG_CONTENT_WITHOUT_HASH } from "../../__tests__/utils";
import Tiny from "../tiny";

test("img src is empty after extract attachments", async () => {
  const tiny = new Tiny(IMG_CONTENT_WITHOUT_HASH);
  const result = await tiny.extractAttachments(async () => {
    return { key: "hello", metadata: { hash: "helloworld" } };
  });
  expect(result.attachments).toHaveLength(1);
  expect(result.data).not.toContain(`src="data:image/png;`);
  expect(result.data).not.toContain(`src=`);
  expect(result.data).toContain(`data-hash="helloworld"`);
});

test("img src is present after insert attachments", async () => {
  const tiny = new Tiny(IMG_CONTENT);
  const result = await tiny.extractAttachments(async () => {
    return { key: "hello", metadata: {} };
  });
  const tiny2 = new Tiny(result.data);
  const result2 = await tiny2.insertMedia(() => "i am a data");
  expect(result2).toContain(`src="i am a data"`);
});
