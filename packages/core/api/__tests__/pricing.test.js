import Pricing from "../pricing";

test.each(["monthly", "yearly", undefined])(`get %s price`, async (period) => {
  const pricing = new Pricing();
  const price = await pricing.price(period);
  expect(price).toMatchSnapshot(`${period || "monthly"}-pricing`);
});

describe.each(["android", "ios", "web"])(`get %s pricing tier`, (platform) => {
  test.each(["monthly", "yearly"])(
    `get %s ${platform} tier`,
    async (period) => {
      const pricing = new Pricing();
      const price = await pricing.sku(platform, period);
      expect(price).toMatchSnapshot(`${period}-${platform}-pricing`);
    }
  );
});
