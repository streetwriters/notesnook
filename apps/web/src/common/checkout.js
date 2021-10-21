import { ANALYTICS_EVENTS, trackEvent } from "../utils/analytics";
import DEFAULT_DATA_MONTHLY from "./monthly.json";
import DEFAULT_DATA_YEARLY from "./yearly.json";

const isDev = false; // process.env.NODE_ENV === "development";

const VENDOR_ID = isDev ? 1506 : 128190;
const PRODUCT_ID = (plan) => {
  if (isDev) return plan === "monthly" ? 9822 : 0;
  else return plan === "monthly" ? 648884 : 658759;
};

function loadPaddle(eventCallback) {
  return new Promise((resolve) => {
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

async function getCouponData(coupon, plan) {
  let url =
    plan === "monthly"
      ? "https://checkout-service.paddle.com/checkout/1122-chree0325aa1705-38b9ffa5ce/coupon"
      : "https://checkout-service.paddle.com/checkout/1122-chre94eb195cbde-12dcba6761/coupon";

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json;charset=UTF-8",
      },
      body: coupon
        ? JSON.stringify({ data: { coupon_code: coupon } })
        : undefined,
      method: coupon ? "POST" : "DELETE",
    });
    const json = await response.json();
    if (response.ok) {
      return json.data;
    } else {
      throw new Error(json.errors[0].details);
    }
  } catch (e) {
    console.error("Error: ", e);
    return plan === "monthly"
      ? DEFAULT_DATA_MONTHLY.data
      : DEFAULT_DATA_YEARLY.data;
  }
}

export { upgrade, openPaddleDialog, getCouponData };
