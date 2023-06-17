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

import { useEffect, useState, useRef, useCallback } from "react";
import { Embed, Flex } from "@theme-ui/components";
import Loader from "../../components/loader";
import {
  CheckoutData,
  CheckoutDataResponse,
  CheckoutPrices,
  PaddleEvent,
  PaddleEvents,
  Plan,
  Price,
  PricingInfo
} from "./types";

// const isDev = false; // import.meta.env.NODE_ENV === "development";
// const VENDOR_ID = isDev ? 1506 : 128190;
const PADDLE_ORIGIN =
  import.meta.env.NODE_ENV === "development"
    ? "https://sandbox-buy.paddle.com"
    : "https://buy.paddle.com";
const CHECKOUT_CREATE_ORIGIN =
  import.meta.env.NODE_ENV === "development"
    ? "https://sandbox-create-checkout.paddle.com"
    : "https://create-checkout.paddle.com";
const CHECKOUT_SERVICE_ORIGIN =
  import.meta.env.NODE_ENV === "development"
    ? "https://sandbox-checkout-service.paddle.com"
    : "https://checkout-service.paddle.com";

const SUBSCRIBED_EVENTS: PaddleEvents[] = [
  PaddleEvents["Checkout.Loaded"],
  PaddleEvents["Checkout.Coupon.Applied"],
  PaddleEvents["Checkout.Coupon.Remove"],
  PaddleEvents["Checkout.Location.Submit"],
  PaddleEvents["Checkout.Complete"]
];

type PaddleCheckoutProps = {
  user: { id: string; email: string };
  theme: "dark" | "light";
  plan: Plan;
  onPriceUpdated?: (pricingInfo: PricingInfo) => void;
  onCouponApplied?: () => void;
  onCompleted?: () => void;
  coupon?: string;
};
export function PaddleCheckout(props: PaddleCheckoutProps) {
  const { plan, onPriceUpdated, coupon, onCouponApplied, onCompleted } = props;
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState<string>();
  const appliedCouponCode = useRef<string>();
  const checkoutRef = useRef<HTMLIFrameElement>(null);

  const reloadCheckout = useCallback(() => {
    if (!checkoutRef.current) return;
    setIsLoading(true);
    checkoutRef.current.src = `${PADDLE_ORIGIN}/checkout/?checkout_id=${checkoutId}&display_mode=inline&apple_pay_enabled=false`;
  }, [checkoutId]);

  const updatePrice = useCallback(
    async (checkoutId: string, isInvalidCoupon?: boolean) => {
      const checkoutData = await getCheckoutData(checkoutId);
      if (!checkoutData) return;
      const pricingInfo = getPricingInfo(plan, checkoutData);
      pricingInfo.invalidCoupon = isInvalidCoupon;
      if (onPriceUpdated) onPriceUpdated(pricingInfo);
      return pricingInfo;
    },
    [onPriceUpdated, plan]
  );

  useEffect(() => {
    (async function () {
      const url = await getCheckoutURL(props);
      setSourceUrl(url);
    })();
  }, [props]);

  useEffect(() => {
    async function onMessage(ev: MessageEvent<PaddleEvent>) {
      if (ev.origin !== PADDLE_ORIGIN) return;
      const { event_name, callback_data } = ev.data;
      const { checkout } = callback_data;

      if (
        !checkout ||
        !checkout.id ||
        SUBSCRIBED_EVENTS.indexOf(event_name) === -1
      )
        return;

      if (event_name === PaddleEvents["Checkout.Complete"]) {
        onCompleted && onCompleted();
        return;
      }
      if (event_name === PaddleEvents["Checkout.Loaded"]) setIsLoading(false);

      const pricingInfo = await updatePrice(checkout.id);
      if (!pricingInfo) return;

      appliedCouponCode.current = pricingInfo.coupon;
      setCheckoutId(checkout.id);
    }
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [onPriceUpdated, updatePrice, plan, onCompleted]);

  useEffect(() => {
    if (
      !checkoutId ||
      appliedCouponCode.current === coupon ||
      !appliedCouponCode.current === !coupon
    )
      return;
    if (onCouponApplied) onCouponApplied();

    (async function () {
      const checkoutData = coupon
        ? await applyCoupon(checkoutId, coupon)
        : await removeCoupon(checkoutId);
      if (!checkoutData) {
        await updatePrice(checkoutId, true);
        return;
      }
      appliedCouponCode.current = coupon;
      reloadCheckout();
    })();
  }, [
    coupon,
    onCouponApplied,
    checkoutId,
    onPriceUpdated,
    plan,
    reloadCheckout,
    updatePrice
  ]);

  return (
    <Flex
      className="checkout-container"
      sx={{ bg: "background", flex: 1, overflowY: "auto" }}
    >
      {isLoading ? (
        <Loader
          text={""}
          title={
            coupon
              ? "Applying coupon code..."
              : "Loading checkout. Please wait..."
          }
        />
      ) : null}
      <Embed
        ref={checkoutRef}
        src={sourceUrl}
        sx={{
          m: 6,
          display: isLoading ? "none" : "block",
          flex: 1,
          outline: "none",
          border: "none",
          minHeight: 500
        }}
      />
    </Flex>
  );
}

async function getCheckoutURL(params: PaddleCheckoutProps) {
  const { plan, theme, user } = params;
  const BASE_URL = `${CHECKOUT_CREATE_ORIGIN}/checkout/product/${plan.id}`;
  const queryParams = new URLSearchParams();
  queryParams.set("product", plan.id);
  queryParams.set("passthrough", JSON.stringify({ userId: user.id }));
  queryParams.set("guest_email", user.email);
  queryParams.set("quantity_variable", "0");
  queryParams.set("disable_logout", "true");
  queryParams.set("display_mode_theme", theme);
  queryParams.set("display_mode", "inline");
  queryParams.set("apple_pay_enabled", "false");
  queryParams.set("paddlejs-version", "2.0.14");
  queryParams.set("popup", "true");
  queryParams.set("paddle_js", "true");
  queryParams.set("is_popup", "true");
  queryParams.set("parent_url", window.location.href);
  const fullURL = `${BASE_URL}?${queryParams.toString()}`;
  return fullURL;
}

function getPricingInfo(plan: Plan, checkoutData: CheckoutData): PricingInfo {
  const { prices, recurring } = checkoutData.items[0];
  const price = prices[0];
  const recurringPrice = recurring.prices[0];
  const discount = price.discounts.length > 0 ? price.discounts[0] : undefined;
  const isRecurringDiscount = recurringPrice.discounts.length > 0;

  return {
    country: checkoutData.customer.country_code,
    currency: price.currency,
    discount: {
      amount: discount?.gross_discount || 0,
      recurring: isRecurringDiscount
    },
    period: plan.period,
    price: normalizeCheckoutPrice(price),
    recurringPrice: normalizeCheckoutPrice(recurringPrice),
    coupon: discount?.code
  };
}

function normalizeCheckoutPrice(prices: CheckoutPrices): Price {
  const price = prices.unit_price;
  return {
    gross: price.gross,
    net: price.net,
    tax: price.tax,
    currency: prices.currency
  };
}

async function applyCoupon(
  checkoutId: string,
  couponCode: string
): Promise<CheckoutData | false> {
  const url = ` ${CHECKOUT_SERVICE_ORIGIN}/checkout/${checkoutId}/coupon`;
  const body = { data: { coupon_code: couponCode } };
  const headers = new Headers();
  headers.set("content-type", "application/json");
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers,
    method: "POST"
  });

  if (!response.ok) return false;
  const json = (await response.json()) as CheckoutDataResponse;

  await sendCheckoutEvent(checkoutId, PaddleEvents["Checkout.Coupon.Applied"]);

  return json.data;
}

async function removeCoupon(checkoutId: string): Promise<CheckoutData | false> {
  const url = ` ${CHECKOUT_SERVICE_ORIGIN}/checkout/${checkoutId}/coupon`;

  const response = await fetch(url, {
    method: "DELETE"
  });
  if (!response.ok) return false;
  const json = (await response.json()) as CheckoutDataResponse;

  await sendCheckoutEvent(checkoutId, PaddleEvents["Checkout.Coupon.Remove"]);

  return json.data;
}

async function sendCheckoutEvent(checkoutId: string, eventName: PaddleEvents) {
  const url = ` ${CHECKOUT_SERVICE_ORIGIN}/checkout/${checkoutId}/event`;
  const body = { data: { event_name: eventName } };
  const headers = new Headers();
  headers.set("content-type", "application/json");
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers,
    method: "POST"
  });
  return response.ok;
}

async function getCheckoutData(
  checkoutId: string
): Promise<CheckoutData | undefined> {
  const url = `${CHECKOUT_SERVICE_ORIGIN}/checkout/${checkoutId}`;
  const response = await fetch(url);
  if (!response.ok) return undefined;
  const json = (await response.json()) as CheckoutDataResponse;
  return json.data;
}
