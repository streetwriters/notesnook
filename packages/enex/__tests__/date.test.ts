import tap from "tap";
import { ISO8601DateTime } from "../src/iso8601datetime";

tap.test("input less than 16 characters should return null", async () => {
  tap.equal(ISO8601DateTime.toDate("hello"), null);
});

tap.test(
  "input of 16 characters but with an invalid date should return null",
  async () => {
    tap.equal(ISO8601DateTime.toDate("01234567891011126"), null);
  }
);
