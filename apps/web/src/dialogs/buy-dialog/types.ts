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

export type Period = "monthly" | "yearly" | "education";

export enum PaddleEvents {
  /**  Checkout has been initialized on the page  **/
  "Checkout.Loaded" = "Checkout.Loaded",
  /**  Checkout has been closed on the page. This is equivalent to when the "closeCallback" checkout parameter is fired .  **/
  "Checkout.Close" = "Checkout.Close",
  /**  Checkout has been completed successfully. This is equivalent to when the "successCallback" checkout parameter is fired .  **/
  "Checkout.Complete" = "Checkout.Complete",
  /**  User has opted into/out of marketing emails in the checkout  **/
  "Checkout.User.Subscribed" = "Checkout.User.Subscribed",
  /**  User has changed the quantity in the checkout  **/
  "Checkout.Quantity.Change" = "Checkout.Quantity.Change",
  /**  User has proceeded past the email checkout step  **/
  "Checkout.Login" = "Checkout.Login",
  /**  User selected 'Not you? Change' in bottom right of checkout  **/
  "Checkout.Logout" = "Checkout.Logout",
  /**  Payment method has been selected  **/
  "Checkout.PaymentMethodSelected" = "Checkout.PaymentMethodSelected",
  /**  User clicked 'Add Coupon'  **/
  "Checkout.Coupon.Add" = "Checkout.Coupon.Add",
  /**  User has submitted a coupon  **/
  "Checkout.Coupon.Submit" = "Checkout.Coupon.Submit",
  /**  User has cancelled the coupon page  **/
  "Checkout.Coupon.Cancel" = "Checkout.Coupon.Cancel",
  /**  Valid coupon applied to purchase  **/
  "Checkout.Coupon.Applied" = "Checkout.Coupon.Applied",
  /**  Coupon has been removed  **/
  "Checkout.Coupon.Remove" = "Checkout.Coupon.Remove",
  /**  Any generic checkout error, like an invalid VAT number or payment failure  **/
  "Checkout.Error" = "Checkout.Error",
  /**  User proceeded past the location page  **/
  "Checkout.Location.Submit" = "Checkout.Location.Submit",
  /**  Language has been changed in the bottom right  **/
  "Checkout.Language.Change" = "Checkout.Language.Change",
  /**  User clicked 'Add VAT Number'  **/
  "Checkout.Vat.Add" = "Checkout.Vat.Add",
  /**  VAT screen cancelled  **/
  "Checkout.Vat.Cancel" = "Checkout.Vat.Cancel",
  /**  VAT number was submitted  **/
  "Checkout.Vat.Submit" = "Checkout.Vat.Submit",
  /**  VAT number was accepted and applied  **/
  "Checkout.Vat.Applied" = "Checkout.Vat.Applied",
  /**  VAT number was removed  **/
  "Checkout.Vat.Remove" = "Checkout.Vat.Remove",
  /**  Wire transfer details have been completed  **/
  "Checkout.WireTransfer.Complete" = "Checkout.WireTransfer.Complete",
  /**  Payment has been completed successfully.  **/
  "Checkout.PaymentComplete" = "Checkout.PaymentComplete",
  /**  User has selected "Change Payment Method" when on the payment screen  **/
  "Checkout.PaymentMethodChange" = "Checkout.PaymentMethodChange",
  /**  User has selected "Change Payment Method" when on the Wire Transfer screen  **/
  "Checkout.WireTransfer.PaymentMethodChange" = "Checkout.WireTransfer.PaymentMethodChange",

  "Checkout.Customer.Details" = "Checkout.Customer.Details",
  "Checkout.RemoveSpinner" = "Checkout.RemoveSpinner"
}

export interface CallbackData {
  checkout?: Checkout;
  coupon?: { coupon_code: string };
  user?: {
    email: string;
    id: string;
    country: string;
  };
}

export interface Checkout {
  id?: string;
  prices: {
    customer: {
      items: CheckoutPrices[];
    };
  };
  recurring_prices: {
    customer: {
      items: CheckoutPrices[];
    };
  };
}

export type PaddleEvent = {
  action: "event";
  event: PaddleEvents;
  event_name: PaddleEvents;
  callback_data: CallbackData;
};

export interface Plan {
  id: string;
  period: Period;
  price: Price;
  currency: string;
  currencySymbol?: string;
  originalPrice: Price;
  discount?: Discount;
  country: string;
}

export type PricingInfo = {
  country: string;
  currency: string;
  price: Price;
  period: Period;
  recurringPrice: Price;
  discount: Discount;
  coupon?: string;
  invalidCoupon?: boolean;
};

export type Discount = {
  type: "regional" | "promo";
  code?: string;
  recurring: boolean;
  amount: number;
};

export interface Price {
  gross: number;
  gross_after_discount?: number;
  net: number;
  net_after_discount?: number;
  tax: number;
  tax_after_discount?: number;
  currency?: string;
}

export interface CheckoutDataResponse {
  data: CheckoutData;
}

export interface CheckoutData {
  public_checkout_id: string;
  // type: string;
  // uuid: string;
  // vendor: Vendor;
  // display_currency: string;
  // charge_currency: string;
  // customer: Customer;
  items: Item[];
  // available_payment_methods: unknown[];
  // total: TotalPrice[];
  // pending_payment: boolean;
  // completed: boolean;
  // payment_method_type: null;
  // flagged_for_review: boolean;
  ip_geo_country_code: string;
  // tax: null;
  // name: null;
  // image_url: null;
  // message: null;
  // passthrough: string;
  // redirect_url: null;
  // created_at: Date;
}

export interface Customer {
  // id: number;
  // email: string;
  country_code: string;
  // postcode: null;
  // audience_opt_in: boolean;
}

export interface Item {
  // checkout_product_id: number;
  // product_id: number;
  // name: string;
  // custom_message: string;
  // quantity: number;
  // allow_quantity: boolean;
  // min_quantity: number;
  // max_quantity: number;
  // icon_url: string;
  prices: CheckoutPrices[];
  recurring: Recurring;
  // webhook_url: null;
}

export interface CheckoutPrices {
  currency: string;
  unit_price: CheckoutPrice;
  // line_price: CheckoutPrice;
  discounts: CheckoutDiscount[];

  recurring: CheckoutPrices;
  // tax_rate: number;
}

export interface CheckoutDiscount {
  // rank: number;
  // type: string;
  // net_discount: number;
  gross_discount: number;
  code: string;
  // description: string;
}

export interface CheckoutPrice {
  net: number;
  gross: number;
  net_discount: number;
  gross_discount: number;
  net_after_discount: number;
  gross_after_discount: number;
  tax: number;
  tax_after_discount: number;
}

export interface Recurring {
  // period: string;
  // interval: number;
  // trial_days: number;
  prices: CheckoutPrices[];
}

export type TotalPrice = CheckoutPrice & {
  currency: string;
  is_free: boolean;
  includes_tax: boolean;
  tax_rate: number;
};

export interface Vendor {
  id: number;
  name: string;
}
