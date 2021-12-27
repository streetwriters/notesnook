import { ANALYTICS_EVENTS, trackEvent } from "../utils/analytics";
import fetchJsonp from "fetch-jsonp";
import Config from "../utils/config";

const isDev = false; // process.env.NODE_ENV === "development";

const VENDOR_ID = isDev ? 1506 : 128190;

/**
 *
 * @param {"yearly"|"monthly"} plan
 * @returns
 */
const PRODUCT_ID = (plan) => {
  if (isDev) return plan === "monthly" ? 9822 : 0;
  else return plan === "monthly" ? 648884 : 658759;
};

function loadPaddle(eventCallback) {
  return new Promise((resolve) => {
    if (window.Paddle) {
      window.Paddle.Options({
        vendor: VENDOR_ID,
        eventCallback,
      });
      resolve();
      return;
    }

    var script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/paddle.js";
    script.async = true;
    var firstScriptElement = document.getElementsByTagName("script")[0];
    script.onload = function () {
      if (isDev) window.Paddle.Environment.set("sandbox");
      window.Paddle.Setup({
        vendor: VENDOR_ID,
        eventCallback,
      });
      resolve();
    };
    firstScriptElement.parentNode.insertBefore(script, firstScriptElement);
  });
}

function inlineCheckout({ user, plan, coupon, country, onCheckoutLoaded }) {
  return new Promise(async (resolve) => {
    await loadPaddle((e) => {
      const data = e.eventData;
      switch (e.event) {
        case "Checkout.Loaded":
        case "Checkout.Location.Submit":
        case "Checkout.Coupon.Applied":
        case "Checkout.Coupon.Remove":
          onCheckoutLoaded && onCheckoutLoaded(data);
          resolve();
          break;
        default:
          break;
      }
    });

    const { Paddle } = window;
    if (!Paddle) return;

    if (coupon) {
      trackEvent(ANALYTICS_EVENTS.offerClaimed, `[${coupon}] redeemed!`);
    } else {
      trackEvent(ANALYTICS_EVENTS.checkoutStarted, `Checkout requested`);
    }

    Paddle.Checkout.open({
      frameTarget: "checkout-container",
      frameStyle: "position: relative; width: 100%; border: 0;",
      frameInitialHeight: 416,
      disableLogout: true,
      allowQuantity: false,
      method: "inline",
      displayModeTheme: Config.get("theme", "light"),
      product: PRODUCT_ID(plan),
      country,
      email: user.email,
      coupon,
      passthrough: JSON.stringify({
        userId: user.id,
      }),
    });
  });
}

async function upgrade(user, coupon, plan) {
  if (!window.Paddle) {
    await loadPaddle();
  }

  const { Paddle } = window;
  if (!Paddle) return;

  if (coupon) {
    trackEvent(ANALYTICS_EVENTS.offerClaimed, `[${coupon}] redeemed!`);
  } else {
    trackEvent(ANALYTICS_EVENTS.checkoutStarted, `Checkout requested`);
  }

  Paddle.Checkout.open({
    product: PRODUCT_ID(plan),
    email: user.email,
    coupon,
    passthrough: JSON.stringify({
      userId: user.id,
    }),
  });
}

async function openPaddleDialog(overrideUrl) {
  if (!window.Paddle) {
    await loadPaddle();
  }

  const { Paddle } = window;
  if (!Paddle) return;

  Paddle.Checkout.open({
    override: overrideUrl,
    product: PRODUCT_ID,
  });
}

async function getPlans() {
  const monthlyProductId = PRODUCT_ID("monthly");
  const yearlyProductId = PRODUCT_ID("yearly");
  const url = `https://checkout.paddle.com/api/2.0/prices?product_ids=${yearlyProductId},${monthlyProductId}&callback=getPrices`;
  const response = await fetchJsonp(url, {
    timeout: 30000,
    jsonpCallback: "callback",
    jsonpCallbackFunction: "getPrices",
  });
  const json = await response.json();
  if (!json || !json.success || !json.response?.products?.length)
    throw new Error("Failed to get prices.");
  return json.response.products;
}

async function getPlan(plan) {
  const productId = PRODUCT_ID(plan);
  const url = `https://checkout.paddle.com/api/2.0/prices?product_ids=${productId}&callback=getPlan`;
  const response = await fetchJsonp(url, {
    timeout: 30000,
    jsonpCallback: "callback",
    jsonpCallbackFunction: "getPlan",
  });
  const json = await response.json();
  if (!json || !json.success || !json.response?.products?.length)
    throw new Error("Failed to get prices.");
  return json.response.products[0];
}

export { upgrade, openPaddleDialog, getPlans, getPlan, inlineCheckout };
