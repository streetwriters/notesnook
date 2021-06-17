import { trackEvent } from "../utils/analytics";

const isDev = process.env.NODE_ENV === "development";

const VENDOR_ID = isDev ? 1506 : 128190;
const PRODUCT_ID = isDev ? 9822 : 648884;

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

async function upgrade(user, coupon) {
  if (!window.Paddle) {
    await loadPaddle();
  }

  const { Paddle } = window;
  if (!Paddle) return;

  if (coupon) {
    trackEvent(`[${coupon}] redeemed!`, "offers");
  } else {
    trackEvent(`Checkout requested`, "checkout");
  }

  Paddle.Checkout.open({
    product: PRODUCT_ID,
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

async function getCouponData(coupon) {
  console.log(coupon);
  let url =
    "https://checkout-service.paddle.com/checkout/97379638-chre9f4b00ed6b3-732b0e853d/coupon";
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
}

export { upgrade, openPaddleDialog, getCouponData };
