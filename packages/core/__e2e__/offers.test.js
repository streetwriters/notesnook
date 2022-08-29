import hosts from "../utils/constants";
import Offers from "../api/offers";

test("get offer code", async () => {
  const offers = new Offers();
  hosts.SUBSCRIPTIONS_HOST = "https://subscriptions.streetwriters.co";
  expect(await offers.getCode("TESTOFFER", "android")).toMatchSnapshot(
    "offer-code"
  );
});

test("get invalid offer code", async () => {
  const offers = new Offers();
  hosts.SUBSCRIPTIONS_HOST = "https://subscriptions.streetwriters.co";
  await expect(() => offers.getCode("INVALIDOFFER", "android")).rejects.toThrow(
    /Not found/i
  );
});
