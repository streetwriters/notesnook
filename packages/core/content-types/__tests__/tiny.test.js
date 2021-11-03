import { IMG_CONTENT } from "../../__tests__/utils";
import Tiny from "../tiny";

test("img src is empty after extract attachments", async () => {
  const tiny = new Tiny(IMG_CONTENT);
  const result = await tiny.extractAttachments(async () => {
    return { key: "hello", metadata: {} };
  });
  expect(result.attachments.length).toBe(1);
  expect(result.data).not.toContain(`src="data:image/png;`);
  expect(result.data).not.toContain(`src=`);
});
