const { Page, test, expect } = require("@playwright/test");
const { getTestId, isTestAll, loginUser } = require("./utils");
const { isAbsent, isPresent } = require("./utils/conditions");
const path = require("path");

/**
 * @type {Page}
 */
var page = null;
global.page = null;
test.beforeEach(async ({ page: _page, baseURL }) => {
  global.page = _page;
  page = _page;
  await page.goto(baseURL);
  await page.waitForSelector(getTestId("routeHeader"));
});

// if (!isTestAll()) test.skip();

const plans = [
  { key: "monthly", title: "Monthly", coupon: "INTRO50" },
  { key: "yearly", title: "Yearly", coupon: "YEAR15" },
];
const pricingItems = ["subtotal", "tax", "discount", "total"];

function getPaddleTestId(id) {
  return `[data-testid="${id}"]`;
}

async function getPrices() {
  let prices = [];
  for (let item of pricingItems) {
    const price = await page.innerText(getTestId(`checkout-price-${item}`));
    prices.push(`${item}: ${price}`);
  }
  return prices;
}

async function getPaddleFrame(selector = "inlineComplianceBarContainer") {
  await page.waitForSelector(`.checkout-container iframe`);

  const paddleFrame = await (
    await page.$(".checkout-container iframe")
  ).contentFrame();
  await paddleFrame.waitForSelector(getPaddleTestId(selector));

  return paddleFrame;
}

async function changeCountry(paddleFrame, countryCode, pinCode) {
  await paddleFrame.selectOption(
    getPaddleTestId("countriesSelect"),
    countryCode
  );

  if (pinCode)
    await paddleFrame.fill(getPaddleTestId("postcodeInput"), pinCode);

  await paddleFrame.click(getPaddleTestId("locationFormSubmitButton"));

  await page.waitForTimeout(1000);
}

test("change plans", async ({ page }) => {
  await loginUser();

  await page.goto("/#/buy/");

  for (let plan of plans) {
    const planTestId = getTestId(`checkout-plan-${plan.key}`);
    await page.click(planTestId);

    await expect(
      page.innerText(getTestId("checkout-plan-title"))
    ).resolves.toBe(plan.title);

    await page.click(getTestId("checkout-plan-change"));
  }
});

test("confirm plan prices", async ({ page }) => {
  await loginUser();

  await page.goto("/#/buy/");

  for (let plan of plans) {
    const planTestId = getTestId(`checkout-plan-${plan.key}`);
    await page.click(planTestId);

    expect((await getPrices()).join("\n")).toMatchSnapshot(
      `checkout-${plan.key}-prices.txt`
    );

    await page.click(getTestId("checkout-plan-change"));
  }
});

test("changing locale should show localized prices", async ({ page }) => {
  await loginUser();

  await page.goto("/#/buy/");

  for (let plan of plans) {
    const planTestId = getTestId(`checkout-plan-${plan.key}`);
    await page.click(planTestId);

    const paddleFrame = await getPaddleFrame();

    await changeCountry(paddleFrame, "IN", "110001");

    const prices = await getPrices();

    expect(prices.join("\n")).toMatchSnapshot(
      `checkout-${plan.key}-IN-prices.txt`
    );

    await page.click(getTestId("checkout-plan-change"));
  }
});

test("applying coupon should change discount & total price", async ({ page }, {
  setTimeout,
}) => {
  setTimeout(60 * 1000);

  await loginUser();

  await page.goto("/#/buy/");

  for (let plan of plans) {
    const planTestId = getTestId(`checkout-plan-${plan.key}`);
    await page.isEnabled(planTestId, { timeout: 10000 });

    await page.click(planTestId);

    await getPaddleFrame();

    await page.fill(getTestId("checkout-coupon-code"), plan.coupon);
    await page.press(getTestId("checkout-coupon-code"), "Enter");

    await getPaddleFrame();

    const prices = await getPrices();

    expect(prices.join("\n")).toMatchSnapshot(
      `checkout-${plan.key}-discounted-prices.txt`
    );

    await page.click(getTestId("checkout-plan-change"));

    await page.waitForTimeout(1000);
  }
});

test("apply coupon through url", async ({ page }) => {
  await loginUser();

  for (let plan of plans) {
    await page.goto(`/#/buy/${plan.key}/${plan.coupon}`);

    await getPaddleFrame();

    const prices = await getPrices();

    expect(prices.join("\n")).toMatchSnapshot(
      `checkout-${plan.key}-discounted-prices.txt`
    );
  }
});

test("apply coupon after changing country", async ({ page }, {
  setTimeout,
}) => {
  setTimeout(60 * 1000);

  await loginUser();

  await page.goto("/#/buy/");

  for (let plan of plans) {
    const planTestId = getTestId(`checkout-plan-${plan.key}`);
    await page.isEnabled(planTestId, { timeout: 10000 });

    await page.click(planTestId);

    const paddleFrame = await getPaddleFrame();

    await changeCountry(paddleFrame, "IN", "110001");

    await page.waitForTimeout(2000); // TODO unreliable

    await page.fill(getTestId("checkout-coupon-code"), plan.coupon);
    await page.press(getTestId("checkout-coupon-code"), "Enter");

    await getPaddleFrame();

    const prices = await getPrices();

    expect(prices.join("\n")).toMatchSnapshot(
      `checkout-${plan.key}-IN-discounted-prices.txt`
    );

    await page.click(getTestId("checkout-plan-change"));

    await page.waitForTimeout(1000);
  }
});
