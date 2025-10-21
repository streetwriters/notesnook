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
import { Flex } from "@theme-ui/components";
import { Loader } from "../../components/loader";
import { PaddleEvent, Plan, PricingInfo } from "./types";
import { ScrollContainer } from "@notesnook/ui";
import useMobile from "../../hooks/use-mobile";
import {
  AvailablePaymentMethod,
  CheckoutEventNames,
  CheckoutOpenLineItem,
  CheckoutEventsCustomerAddress,
  CheckoutEventsData
} from "@paddle/paddle-js";
import { isFeatureSupported } from "../../utils/feature-check";
import { formatPrice, IS_DEV } from "./helpers";
import { CheckoutCustomerUserInfo } from "@paddle/paddle-js/types/checkout/customer";
import { logger } from "../../utils/logger";
import { Period } from "@notesnook/core";

export const SELLER_ID = IS_DEV ? 1506 : 128190;
export const CLIENT_PADDLE_TOKEN = IS_DEV
  ? "test_e29ab18724934c1d35a05a7d2cb"
  : "live_251f65dc0ac5ac364e44817fe92";
const PADDLE_ORIGIN = IS_DEV
  ? "https://sandbox-buy.paddle.com"
  : "https://buy.paddle.com";
const CHECKOUT_SERVICE = IS_DEV
  ? "https://sandbox-checkout-service.paddle.com"
  : "https://checkout-service.paddle.com";
const PADDLE_API = IS_DEV
  ? "https://sandbox-api.paddle.com"
  : "https://api.paddle.com";

const SUBSCRIBED_EVENTS: CheckoutEventNames[] = [
  CheckoutEventNames.CHECKOUT_LOADED,
  CheckoutEventNames.CHECKOUT_COMPLETED,
  CheckoutEventNames.CHECKOUT_CUSTOMER_UPDATED
];

type PaddleCheckoutProps = {
  user: { id: string; email: string };
  theme: "dark" | "light";
  plan: Plan;
  onPriceUpdated?: (pricingInfo: PricingInfo) => void;
  onCompleted?: () => void;
  coupon?: string;
};
export function PaddleCheckout(props: PaddleCheckoutProps) {
  const { plan, onPriceUpdated, coupon, onCompleted, user, theme } = props;
  const [isLoading, setIsLoading] = useState(true);
  const appliedCouponCode = useRef<string>();
  const checkoutDataRef = useRef<CheckoutEventsData>();
  const checkoutRef = useRef<HTMLIFrameElement>(null);
  const addressRef = useRef<CheckoutEventsCustomerAddress | undefined>();
  const isMobile = useMobile();

  const reloadCheckout = useCallback(() => {
    if (!checkoutRef.current || !checkoutDataRef.current) return;
    setIsLoading(true);
    checkoutRef.current.src = "about:blank";
    checkoutRef.current.src = getCheckoutURL(checkoutDataRef.current.id, theme);
  }, [theme]);

  useEffect(() => {
    if (checkoutDataRef.current) {
      if (
        coupon &&
        (!checkoutDataRef.current.discount ||
          checkoutDataRef.current.discount.code !== coupon)
      ) {
        applyCoupon(checkoutDataRef.current.id, coupon).then(() =>
          reloadCheckout()
        );
      } else if (!coupon && checkoutDataRef.current.discount)
        removeDiscount(
          checkoutDataRef.current.id,
          checkoutDataRef.current.discount.id
        ).then(() => reloadCheckout());
    } else {
      createCheckout({ theme, user, coupon, plan }).then(
        async (checkoutData) => {
          if (!checkoutData) return;
          const pricingInfo = getPricingInfo(checkoutData, {
            currencyCode: checkoutData.currency_code,
            period: plan.period,
            discountCode: coupon,
            countryCode: checkoutData.customer?.address?.country_code
          });
          if (!pricingInfo) return;

          addressRef.current = checkoutData.customer?.address || undefined;
          onPriceUpdated?.(pricingInfo);
          appliedCouponCode.current = pricingInfo.coupon;
          checkoutDataRef.current = checkoutData;
          reloadCheckout();
        }
      );
    }
  }, [coupon, onPriceUpdated, plan, reloadCheckout, theme, user]);

  useEffect(() => {
    async function onMessage(ev: MessageEvent<PaddleEvent>) {
      if (ev.origin !== PADDLE_ORIGIN || !ev.data) return;
      logger.debug("Paddle event received", { data: ev.data });
      const { event_name, callback_data } = ev.data;

      if (event_name === CheckoutEventNames.CHECKOUT_FAILED) {
        setIsLoading(false);
        return;
      }

      if (!callback_data.data || SUBSCRIBED_EVENTS.indexOf(event_name) === -1) {
        return;
      }

      if (event_name === CheckoutEventNames.CHECKOUT_COMPLETED) {
        onCompleted && onCompleted();
        return;
      }

      if (event_name === CheckoutEventNames.CHECKOUT_LOADED) {
        setIsLoading(false);
      }
      console.log(callback_data.data);

      addressRef.current = callback_data.data.customer?.address || undefined;
      const pricingInfo = getPricingInfo(callback_data.data, {
        period: plan.period,
        currencyCode: callback_data.data.currency_code,
        discountCode: coupon,
        countryCode: callback_data.data.customer?.address?.country_code
      });
      if (onPriceUpdated) onPriceUpdated(pricingInfo);
      appliedCouponCode.current = pricingInfo.coupon;
      checkoutDataRef.current = callback_data.data || checkoutDataRef.current;
    }
    window.addEventListener("message", onMessage, false);
    return () => {
      window.removeEventListener("message", onMessage, false);
    };
  }, [onPriceUpdated, plan, coupon, onCompleted]);

  return (
    <ScrollContainer
      style={{ flex: isMobile ? "unset" : 1, flexShrink: 0 }}
      suppressScrollX={isMobile}
      suppressScrollY={isMobile}
    >
      {isLoading ? (
        <Flex
          sx={{ background: "background", overflow: "hidden", height: "100%" }}
        >
          <Loader
            title={
              coupon
                ? "Applying coupon code..."
                : "Loading checkout. Please wait..."
            }
          />
        </Flex>
      ) : null}
      <Flex
        className="checkout-container"
        sx={{ background: "background", overflow: "hidden", px: [0, 30] }}
      >
        <iframe
          scrolling="no"
          frameBorder={"0"}
          ref={checkoutRef}
          allow={`payment`} // ${PADDLE_ORIGIN} ${SUBSCRIPTION_MANAGEMENT_URL};`}
          style={{
            //   padding: "0px 30px",
            height: "1000px",
            width: "100%",
            display: isLoading ? "none" : "block",
            flex: 1,
            outline: "none",
            border: "none"
            // minHeight: 500
          }}
        />
      </Flex>
    </ScrollContainer>
  );
}

function getCheckoutURL(id: string, theme: PaddleCheckoutProps["theme"]) {
  return `${PADDLE_ORIGIN}/checkout/${id}?display_mode=inline&variant=multi-page&display_mode_theme=${theme}&checkout_type=transaction-checkout&apple_pay_enabled=${isFeatureSupported(
    "applePaySupported"
  )}`;
}

type PriceOptions = {
  period: Period;
  currencyCode: string;
  discountCode?: string;
  countryCode?: string;
};

function getPricingInfo(
  data: CheckoutEventsData,
  options: PriceOptions
): PricingInfo {
  const isRecurringDiscount = !!data.recurring_totals?.discount;
  const price = data.items[0];
  const totals = price.trial_period
    ? price.recurring_totals || price.totals
    : price.totals;
  return {
    country: options.countryCode || "US",
    period: options.period,
    coupon: data.discount?.code,
    invalidCoupon: !!options.discountCode && !data.discount,
    discount:
      data.totals.discount > 0
        ? {
            recurring: isRecurringDiscount,
            type: "promo",
            code: data.discount?.code,
            amount: data.totals.discount
          }
        : undefined,
    recurringPrice: data.recurring_totals
      ? {
          currency: data.currency_code,
          id: price.price_id,
          period: options.period,
          subtotal: formatPrice(
            data.recurring_totals.subtotal - data.recurring_totals.discount,
            data.currency_code
          ),
          total: formatPrice(data.recurring_totals.total, data.currency_code),
          tax: formatPrice(data.recurring_totals.tax, data.currency_code)
        }
      : undefined,
    price: {
      currency: data.currency_code,
      id: price.price_id,
      period: options.period,
      subtotal: formatPrice(
        totals.subtotal - totals.discount,
        data.currency_code
      ),
      total: formatPrice(totals.total, data.currency_code),
      tax: formatPrice(totals.tax, data.currency_code),
      trial_period: price.trial_period
        ? {
            frequency: price.trial_period.frequency
          }
        : undefined
    }
  };
}

enum THEME {
  LIGHT = "light",
  DARK = "dark",
  GREEN = "green"
}
enum DISPLAY_MODE {
  OVERLAY = "overlay",
  INLINE = "inline",
  WIDE_OVERLAY = "wide-overlay"
}
interface CheckoutOutputAttributesProps {
  customer?: CheckoutCustomerUserInfo & {
    address?: Partial<CheckoutEventsCustomerAddress>;
  };
  custom_data?: string;
  items?: InternalCheckoutOpenLineItem[];
  customer_auth_token?: string;
  discount_code?: string;
  discount_id?: string;
  transaction_id?: string;
  settings?: {
    locale?: string;
    theme?: THEME;
    success_url?: string;
    allow_logout?: boolean;
    show_add_discounts?: boolean;
    allow_discount_removal?: boolean;
    show_add_tax_id?: boolean;
    frame_target?: string;
    frame_initial_height?: number;
    frame_style?: string;
    display_mode?: DISPLAY_MODE;
    source_page?: string;
    allowed_payment_methods?: AvailablePaymentMethod[];
  };
  seller_id?: number | null;
  client_token?: string;
  apple_pay_enabled?: boolean;
  checkout_initiated?: number;
  "paddlejs-version"?: string | null;
}

type InternalCheckoutOpenLineItem = Omit<CheckoutOpenLineItem, "priceId"> & {
  price_id?: string;
};

function getCheckoutSettings(
  theme: PaddleCheckoutProps["theme"]
): CheckoutOutputAttributesProps["settings"] {
  return {
    allow_discount_removal: true,
    allowed_payment_methods: [
      "apple_pay",
      "card",
      "google_pay",
      "paypal",
      "alipay",
      "bancontact",
      "ideal"
    ],
    display_mode: DISPLAY_MODE.INLINE,
    allow_logout: false,
    show_add_discounts: true,
    theme: theme === "dark" ? THEME.DARK : THEME.LIGHT,
    source_page: window.location.href
  };
}

interface CheckoutDataResponse {
  data: CheckoutEventsData & { ip_geo_country_code: string };
}

async function createCheckout(props: {
  plan: PaddleCheckoutProps["plan"];
  user: PaddleCheckoutProps["user"];
  theme: PaddleCheckoutProps["theme"];
  coupon?: PaddleCheckoutProps["coupon"];
}) {
  const { user, theme, coupon, plan } = props;
  const response = await fetch(`${CHECKOUT_SERVICE}/transaction-checkout`, {
    method: "POST",
    body: JSON.stringify({
      data: plan.transactionId
        ? {
            custom_data: JSON.stringify({ userId: user.id }),
            transaction_id: plan.transactionId,
            settings: getCheckoutSettings(theme)
          }
        : {
            custom_data: JSON.stringify({ userId: user.id }),
            customer: { email: user.email },
            items: [{ price_id: plan.id, quantity: 1 }],
            settings: getCheckoutSettings(theme)
          }
    }),
    headers: {
      "Content-Type": "application/json",
      "paddle-clienttoken": CLIENT_PADDLE_TOKEN
    }
  });
  if (!response.ok) return false;

  const json = (await response.json()) as CheckoutDataResponse;

  let checkoutData = json.data;
  if (plan.transactionId) return checkoutData;

  const checkoutId = checkoutData.id;

  checkoutData = await submitCustomerInfo(
    checkoutId,
    user.email,
    json.data.ip_geo_country_code
  )
    .then((res) => (res ? res : checkoutData))
    .catch(() => checkoutData);

  if (coupon)
    checkoutData = await applyCoupon(checkoutId, coupon)
      .then((res) => (res ? res : checkoutData))
      .catch(() => checkoutData);

  return checkoutData;
}

async function submitCustomerInfo(
  checkoutId: string,
  email: string,
  country: string
): Promise<CheckoutDataResponse["data"] | false> {
  if (IS_TESTING) return false;

  const url = `${CHECKOUT_SERVICE}/transaction-checkout/${checkoutId}/customer`;
  const body = {
    data: {
      customer: {
        email,
        marketing_consent: false,
        address: { country_code: country, postal_code: "1123212" }
      }
    }
  };
  const headers = new Headers();
  headers.set("content-type", "application/json");
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers,
    method: "POST"
  });

  if (!response.ok) return false;

  const json = (await response.json()) as CheckoutDataResponse;
  return json.data;
}

async function applyCoupon(
  checkoutId: string,
  couponCode: string
): Promise<CheckoutDataResponse["data"] | false> {
  const url = `${CHECKOUT_SERVICE}/transaction-checkout/${checkoutId}/discount`;
  const body = { data: { discount_code: couponCode } };
  const headers = new Headers();
  headers.set("content-type", "application/json");
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers,
    method: "PATCH"
  });

  if (!response.ok) return false;
  const json = (await response.json()) as CheckoutDataResponse;
  return json.data;
}

async function removeDiscount(
  checkoutId: string,
  discountId: string
): Promise<CheckoutDataResponse["data"] | false> {
  const url = `${CHECKOUT_SERVICE}/transaction-checkout/${checkoutId}/discount/${discountId}`;
  const response = await fetch(url, {
    method: "DELETE"
  });
  if (!response.ok) return false;
  const json = (await response.json()) as CheckoutDataResponse;
  return json.data;
}
