import tap from "tap";
import { Znel } from "../index";

tap.test("znel file without a ZNote element should throw", async () => {
  const invalidZnel = "<h1></h1>";
  tap.throws(
    () => new Znel(invalidZnel),
    /Invalid znel file. Must contain ZNote element./g
  );
});

tap.test(
  "znel file without znelVersion attribute in ZNote element should throw",
  async () => {
    const invalidZnel = `<ZNote>
  </ZNote>`;
    tap.throws(
      () => new Znel(invalidZnel),
      /Invalid znel. znelVersion attribute is required./g
    );
  }
);
