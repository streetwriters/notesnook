/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";
import { PriceItem } from "./types";
import { iterateList } from "./utils";

export class CheckoutModel {
  private readonly page: Page;
  private readonly seeAllPlansButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.seeAllPlansButton = page.locator(getTestId("see-all-plans"));
  }

  async goto(period?: "monthly" | "yearly", coupon?: string) {
    let url = "/notes/#/buy/";
    if (period) url += period;
    if (coupon) url += `/${coupon}`;
    await this.page.goto(url);
    if (!period && !coupon) await this.seeAllPlansButton.waitFor();
  }

  async getPlans() {
    await this.seeAllPlansButton.click();

    const plans: Plan[] = [];
    for await (const item of iterateList(
      this.page.locator(getTestId("checkout-plan"))
    )) {
      const plan = new Plan(item);
      const planTitle = await plan.getTitle();
      if (planTitle?.startsWith("Education")) continue;
      plans.push(plan);
    }
    return plans;
  }

  async getPricing() {
    const pricing = new PricingModel(this.page);
    await pricing.waitFor();
    return pricing;
  }
}

class Plan {
  private readonly titleText: Locator;
  constructor(private readonly locator: Locator) {
    this.titleText = locator.locator(getTestId("title"));
  }

  getTitle() {
    return this.titleText.textContent();
  }

  async open() {
    await this.locator.click();
    const pricing = new PricingModel(this.locator.page());
    await pricing.waitFor();
    return pricing;
  }
}

class PricingModel {
  private readonly title: Locator;
  private readonly changePlanButton: Locator;
  private readonly couponInput: Locator;
  constructor(private readonly page: Page) {
    this.title = page.locator(getTestId("checkout-plan-title"));
    this.changePlanButton = page.locator(getTestId("checkout-plan-change"));
    this.couponInput = page.locator(getTestId("checkout-coupon-code"));
  }

  async waitFor() {
    await this.changePlanButton.waitFor();
  }

  async waitForCoupon() {
    await getPaddleFrame(this.page);

    await this.page.locator(getTestId(`checkout-plan-coupon-applied`)).waitFor({
      state: "attached"
    });
  }

  async waitForPaddleFrame() {
    await getPaddleFrame(this.page);
  }

  getTitle() {
    return this.title.textContent();
  }

  async getPrices() {
    const prices: PriceItem[] = [];
    for await (const item of iterateList(
      this.page.locator(getTestId("checkout-price-item"))
    )) {
      const label = await item.locator(getTestId("label")).innerText();
      const value = await item.locator(getTestId("value")).innerText();
      prices.push({ label, value });
    }
    return prices;
  }

  async applyCoupon(couponCode: string) {
    await this.couponInput.fill(couponCode);
    await this.couponInput.press("Enter");
    await this.waitForCoupon();
  }

  async changeCountry(countryCode: string, pinCode?: number) {
    const paddle = await getPaddleFrame(this.page);

    await paddle
      .locator(getPaddleTestId("countriesSelect"))
      .selectOption(countryCode, { force: true });

    if (pinCode)
      await paddle
        .locator(getPaddleTestId("postcodeInput"))
        .fill(pinCode.toString());

    let locationFormSubmitButton = paddle.locator(
      getPaddleTestId("combinedAuthenticationLocationFormSubmitButton")
    );
    if (!(await locationFormSubmitButton.isVisible()))
      locationFormSubmitButton = paddle.locator(
        getPaddleTestId("locationFormSubmitButton")
      );
    await locationFormSubmitButton.click();

    await paddle
      .locator(getPaddleTestId("inlineComplianceBarContainer"))
      .waitFor();

    await this.page
      .locator(getTestId(`checkout-plan-country-${countryCode}`))
      .waitFor({ state: "attached" });
  }

  async changePlan() {
    await this.changePlanButton.click();
  }
}

function getPaddleTestId(id: string) {
  return `[data-testid="${id}"]`;
}

async function getPaddleFrame(page: Page) {
  const paddleFrame = page.frameLocator(`.checkout-container iframe`);
  await paddleFrame
    .locator(getPaddleTestId("inlineComplianceBarContainer"))
    .waitFor();
  return paddleFrame;
}
