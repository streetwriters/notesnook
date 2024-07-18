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
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as RNIap from "react-native-iap";
import { DatabaseLogger, db } from "../common/database";
import { eSendEvent } from "../services/event-manager";
import PremiumService from "../services/premium";
import { useSettingStore } from "../stores/use-setting-store";
import { useUserStore } from "../stores/use-user-store";
import { eClosePremiumDialog, eCloseSheet } from "../utils/events";
import { sleep } from "../utils/time";

function numberWithCommas(x: string) {
  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  subscriptionSkuList: string[];
  subscriptions?: Record<string, RNIap.Subscription | undefined>;
  products?: Record<string, RNIap.Product | undefined>;
  trialSupported?: boolean;
  recommended?: boolean;
  productSkuList: string[];
};

const UUID_PREFIX = "0bdaea";
const UUID_VERSION = "4";
const UUID_VARIANT = "a";

function toUUID(str: string) {
  return [
    UUID_PREFIX + str.substring(0, 2), // 6 digit prefix + first 2 oid digits
    str.substring(2, 6), // # next 4 oid digits
    UUID_VERSION + str.substring(6, 9), // # 1 digit version(0x4) + next 3 oid digits
    UUID_VARIANT + str.substring(9, 12), // # 1 digit variant(0b101) + 1 zero bit + next 3 oid digits
    str.substring(12)
  ].join("-");
}

const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Basic features for personal use",
    subscriptionSkuList: [],
    productSkuList: []
  },
  {
    id: "essential",
    name: "Essential",
    description: "Unlocks essential features for personal use",
    subscriptionSkuList: [
      "notesnook.essential.monthly",
      "notesnook.essential.yearly",
      // no trial
      "notesnook.essential.monthly.nt",
      "notesnook.essential.yearly.nt"
    ],
    trialSupported: true,
    productSkuList: []
  },
  {
    id: "pro",
    name: "Pro",
    description: "Unlocks all features for professional use",
    subscriptionSkuList: [
      "notesnook.pro.monthly",
      "notesnook.pro.yearly",
      "notesnook.pro.monthly.tier2",
      "notesnook.pro.yearly.tier2",
      "notesnook.pro.monthly.tier3",
      "notesnook.pro.yearly.tier3",
      // no trial
      "notesnook.pro.monthly.nt",
      "notesnook.pro.yearly.nt",
      "notesnook.pro.monthly.tier2.nt",
      "notesnook.pro.yearly.tier2.nt",
      "notesnook.pro.monthly.tier3.nt",
      "notesnook.pro.yearly.tier3.nt"
    ],
    productSkuList: ["notesnook.pro.5year"],
    trialSupported: true,
    recommended: true
  },
  {
    id: "believer",
    name: "Believer",
    description: "Become a believer and support the project",
    subscriptionSkuList: [
      "notesnook.believer.monthly",
      "notesnook.believer.yearly",
      // no trial
      "notesnook.believer.monthly.nt",
      "notesnook.believer.yearly.nt"
    ],
    productSkuList: ["notesnook.believer.5year"],
    trialSupported: true
  }
];

const promoCyclesMonthly = {
  1: "first month",
  2: "first 2 months",
  3: "first 3 months",
  4: "first 4 months",
  5: "first 5 months",
  6: "first 3 months"
};

const promoCyclesYearly = {
  1: "first year",
  2: "first 2 years",
  3: "first 3 years"
};

type PricingPlansOptions = {
  promoOffer?: {
    promoCode: string;
  };
  planId?: string;
  productId?: string;
  onBuy?: () => void;
};

const usePricingPlans = (options?: PricingPlansOptions) => {
  const user = useUserStore((state) => state.user);
  const [currentPlan, setCurrentPlan] = useState<string>(
    options?.planId || pricingPlans[0].id
  );
  const [plans, setPlans] = useState<PricingPlan[]>(pricingPlans);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedProductSku, setSelectedProductSku] = useState<
    string | undefined
  >(options?.productId || undefined);
  const [isPromoOffer, setIsPromoOffer] = useState(false);
  const [cancelPromo, setCancelPromo] = useState(false);

  const getProduct = (planId: string, skuId: string) => {
    return (
      plans.find((p) => p.id === planId)?.subscriptions?.[skuId] ||
      plans.find((p) => p.id === planId)?.products?.[skuId]
    );
  };

  const getProductAndroid = (planId: string, skuId: string) => {
    return getProduct(planId, skuId) as RNIap.SubscriptionAndroid;
  };

  const getProductIOS = (planId: string, skuId: string) => {
    return getProduct(planId, skuId) as RNIap.SubscriptionIOS;
  };

  const hasTrialOffer = () => {
    if (!selectedProductSku) return false;

    return Platform.OS === "ios"
      ? !!(getProduct(currentPlan, selectedProductSku) as RNIap.SubscriptionIOS)
          ?.introductoryPrice
      : (
          getProduct(
            currentPlan,
            selectedProductSku
          ) as RNIap.SubscriptionAndroid
        ).subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList
          ?.length > 1;
  };

  const userCanRequestTrial = hasTrialOffer();
  // user && (!user.subscription || !user.subscription.expiry) ? true : false;

  useEffect(() => {
    const loadPlans = async () => {
      const items = await PremiumService.loadProductsAndSubs();
      pricingPlans.forEach((plan) => {
        plan.subscriptions = {};
        plan.products = {};
        plan.subscriptionSkuList.forEach((sku) => {
          if (!plan.subscriptions) plan.subscriptions = {};
          plan.subscriptions[sku] = items.subs.find((p) => p.productId === sku);
        });
        plan.productSkuList.forEach((sku) => {
          if (!plan.products) plan.products = {};
          plan.products[sku] = items.products.find((p) => p.productId === sku);
        });
      });
      setPlans([...pricingPlans]);
      setLoadingPlans(false);
    };

    const loadPromoOffer = async () => {
      if (cancelPromo) {
        setIsPromoOffer(false);
        return;
      }
      if (options?.promoOffer?.promoCode) {
        const promoCode = options.promoOffer.promoCode;
        let skuId: string;
        if (promoCode.startsWith("com.streetwriters.notesnook")) {
          skuId = promoCode;
        } else {
          skuId = await db.offers?.getCode(
            promoCode.split(":")[0],
            Platform.OS as "ios" | "android" | "web"
          );
        }

        const plan = pricingPlans.find((p) =>
          p.subscriptionSkuList.includes(skuId)
        );
        if (plan) {
          setCurrentPlan(plan.id);
          setSelectedProductSku(skuId);
          setIsPromoOffer(true);
        }
      }
    };

    loadPlans().then(() => loadPromoOffer());
  }, [options?.promoOffer, cancelPromo]);

  function getLocalizedPrice(product: RNIap.Subscription | RNIap.Product) {
    if (!product) return;

    if (Platform.OS === "android") {
      const pricingPhaseListItem = (product as RNIap.SubscriptionAndroid)
        ?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[1];

      return (
        pricingPhaseListItem?.formattedPrice ||
        (product as RNIap.ProductAndroid).oneTimePurchaseOfferDetails
          ?.formattedPrice
      );
    } else {
      return (product as RNIap.SubscriptionIOS)?.localizedPrice;
    }
  }
  function getOfferTokenAndroid(
    product: RNIap.Subscription,
    offerIndex: number
  ) {
    return (product as RNIap.SubscriptionAndroid).subscriptionOfferDetails?.[
      offerIndex
    ].offerToken;
  }

  async function subscribe(
    product: RNIap.Subscription,
    androidOfferToken?: string
  ) {
    if (loading || !product) return;
    setLoading(true);
    try {
      if (!user) {
        setLoading(false);
        return;
      }
      useSettingStore.getState().setAppDidEnterBackgroundForAction(true);

      if (product.productId.includes("5year")) {
        if (Platform.OS === "android") {
          androidOfferToken =
            (
              product as RNIap.SubscriptionAndroid
            ).subscriptionOfferDetails.find(
              (offer) => offer.offerToken === androidOfferToken
            )?.offerToken ||
            (product as RNIap.SubscriptionAndroid).subscriptionOfferDetails?.[0]
              .offerToken;

          if (!androidOfferToken) return;
        }

        DatabaseLogger.info(
          `Subscription Requested initiated for user ${toUUID(user.id)}`
        );

        await RNIap.requestSubscription({
          sku: product?.productId,
          obfuscatedAccountIdAndroid: user.id,
          obfuscatedProfileIdAndroid: user.id,
          /**
           * iOS
           */
          appAccountToken: toUUID(user.id),
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
          subscriptionOffers: androidOfferToken
            ? [
                {
                  offerToken: androidOfferToken,
                  sku: product?.productId
                }
              ]
            : undefined
        });
      } else {
        await RNIap.requestPurchase({
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
          appAccountToken: toUUID(user.id),
          obfuscatedAccountIdAndroid: user.id,
          obfuscatedProfileIdAndroid: user.id,
          sku: product.productId,
          quantity: 1
        });
      }
      useSettingStore.getState().setAppDidEnterBackgroundForAction(false);
      setLoading(false);
      options?.onBuy?.();
    } catch (e) {
      setLoading(false);
    }
  }

  function getPromoCycleText(product: RNIap.Subscription) {
    if (!selectedProductSku) return;
    const isMonthly = selectedProductSku?.indexOf(".monthly") > -1;

    const cycleText = isMonthly
      ? promoCyclesMonthly[
          (Platform.OS === "android"
            ? (product as RNIap.SubscriptionAndroid).subscriptionOfferDetails[0]
                ?.pricingPhases.pricingPhaseList?.[0].billingCycleCount
            : parseInt(
                (product as RNIap.SubscriptionIOS)
                  .introductoryPriceNumberOfPeriodsIOS as string
              )) as keyof typeof promoCyclesMonthly
        ]
      : promoCyclesYearly[
          (Platform.OS === "android"
            ? (product as RNIap.SubscriptionAndroid).subscriptionOfferDetails[0]
                ?.pricingPhases.pricingPhaseList?.[0].billingCycleCount
            : parseInt(
                (product as RNIap.SubscriptionIOS)
                  .introductoryPriceNumberOfPeriodsIOS as string
              )) as keyof typeof promoCyclesYearly
        ];

    return cycleText;
  }

  const getBillingPeriod = (
    product: RNIap.Subscription,
    offerIndex: number
  ) => {
    if (Platform.OS === "android") {
      const period = (product as RNIap.SubscriptionAndroid)
        ?.subscriptionOfferDetails?.[offerIndex]?.pricingPhases
        ?.pricingPhaseList?.[0].billingPeriod;
      return period.endsWith("W")
        ? "week"
        : period.endsWith("M")
        ? "month"
        : "year";
    } else {
      const unit = (product as RNIap.SubscriptionIOS)
        ?.subscriptionPeriodUnitIOS;
      return unit?.toLocaleLowerCase();
    }
  };

  const getBillingDuration = (
    product: RNIap.Subscription,
    offerIndex: number,
    phaseIndex: number,
    trialDurationIos?: boolean
  ) => {
    if (product.productId.includes("5year")) {
      return {
        type: "year",
        duration: 5
      };
    }

    if (Platform.OS === "android") {
      const phase = (product as RNIap.SubscriptionAndroid)
        ?.subscriptionOfferDetails?.[offerIndex]?.pricingPhases
        ?.pricingPhaseList?.[phaseIndex];

      const duration = parseInt(phase.billingPeriod[1]);

      return {
        duration: phase.billingPeriod.endsWith("W") ? duration * 7 : duration,
        type: phase.billingPeriod.endsWith("W")
          ? "week"
          : phase.billingPeriod.endsWith("M")
          ? "month"
          : "year"
      };
    } else {
      const productIos = product as RNIap.SubscriptionIOS;
      const unit = trialDurationIos
        ? productIos.introductoryPriceSubscriptionPeriodIOS
        : productIos.subscriptionPeriodUnitIOS;

      const duration = parseInt(
        (trialDurationIos
          ? productIos.introductoryPriceNumberOfPeriodsIOS
          : productIos.subscriptionPeriodNumberIOS) || "1"
      );

      return {
        duration: unit === "WEEK" ? duration * 7 : duration,
        type: unit?.toLocaleLowerCase()
      };
    }
  };

  const getTrialInfo = (product: RNIap.Subscription) => {
    if (Platform.OS === "android") {
      const ProductAndroid = (product as RNIap.SubscriptionAndroid)
        .subscriptionOfferDetails?.[0];
      if (ProductAndroid.pricingPhases.pricingPhaseList?.length === 1) return;
      return {
        period:
          ProductAndroid?.pricingPhases.pricingPhaseList?.[0].billingPeriod,
        cycles:
          ProductAndroid?.pricingPhases.pricingPhaseList?.[0].billingCycleCount
      };
    } else {
      const productIos = product as RNIap.SubscriptionIOS;
      if (!productIos.introductoryPrice) return;
      return {
        period: productIos.introductoryPriceSubscriptionPeriodIOS,
        cycles: productIos.introductoryPriceNumberOfPeriodsIOS
          ? parseInt(productIos.introductoryPriceNumberOfPeriodsIOS as string)
          : 1
      };
    }
  };

  const convertPrice = (
    amount: number,
    symbol: string,
    isAtLeft: boolean,
    splitBy = 12
  ) => {
    const monthlyPrice = amount / splitBy;
    const formattedPrice = numberWithCommas(monthlyPrice.toFixed(2));

    return isAtLeft
      ? `${symbol} ${formattedPrice}`
      : `${formattedPrice} ${symbol}`;
  };

  const getDiscountValue = (p1: string, p2: string, splitToMonth?: boolean) => {
    let price1 = Platform.OS === "ios" ? parseInt(p1) : parseInt(p1) / 1000000;
    const price2 =
      Platform.OS === "ios" ? parseInt(p2) : parseInt(p2) / 1000000;

    price1 = splitToMonth ? price1 / 12 : price1;

    return (((price2 - price1) / price2) * 100).toFixed(0);
  };

  const compareProductPrice = (planId: string, sku1: string, sku2: string) => {
    const plan = pricingPlans.find((p) => p.id === planId);
    const p1 = plan?.subscriptions?.[sku1];
    const p2 = plan?.subscriptions?.[sku2];

    if (!p1 || !p2) return 0;

    if (Platform.OS === "android") {
      const androidPricingPhase1 = (p1 as RNIap.SubscriptionAndroid)
        ?.subscriptionOfferDetails?.[0].pricingPhases?.pricingPhaseList?.[1];
      const androidPricingPhase2 = (p2 as RNIap.SubscriptionAndroid)
        ?.subscriptionOfferDetails?.[0].pricingPhases?.pricingPhaseList?.[1];

      return getDiscountValue(
        androidPricingPhase1.priceAmountMicros,
        androidPricingPhase2.priceAmountMicros,
        true
      );
    } else {
      return getDiscountValue(
        (p1 as RNIap.SubscriptionIOS).price,
        (p2 as RNIap.SubscriptionIOS).price,
        true
      );
    }
  };

  const getPriceParts = (price: number, localizedPrice: string) => {
    let priceValue: number;

    if (Platform.OS === "ios") {
      priceValue = price;
    } else {
      priceValue = price / 1000000;
    }
    const priceSymbol = localizedPrice.replace(/[\s\d,.]+/, "");

    return { priceValue, priceSymbol, localizedPrice };
  };

  const getPrice = (
    product: RNIap.Subscription | RNIap.Product,
    phaseIndex: number,
    annualBilling?: boolean
  ) => {
    if (!product) return null;

    const androidPricingPhase = (product as RNIap.SubscriptionAndroid)
      ?.subscriptionOfferDetails?.[0].pricingPhases?.pricingPhaseList?.[
      phaseIndex
    ];
    console.log(product as RNIap.Product);

    const { localizedPrice, priceSymbol, priceValue } = getPriceParts(
      Platform.OS === "android"
        ? parseInt(
            androidPricingPhase?.priceAmountMicros ||
              (product as RNIap.ProductAndroid)?.oneTimePurchaseOfferDetails
                ?.priceAmountMicros ||
              "0"
          )
        : parseInt((product as RNIap.SubscriptionIOS).price),
      Platform.OS === "android"
        ? androidPricingPhase?.formattedPrice ||
            (product as RNIap.ProductAndroid).oneTimePurchaseOfferDetails
              ?.formattedPrice ||
            "0"
        : (product as RNIap.SubscriptionIOS).localizedPrice
    );

    return !annualBilling && !product?.productId.includes("5year")
      ? getLocalizedPrice(product as RNIap.Subscription)
      : convertPrice(
          priceValue,
          priceSymbol,
          localizedPrice.startsWith(priceSymbol),
          annualBilling ? 12 : 60
        );
  };

  // const getPricingPhases = (product: RNIap.Subscription) => {
  //   if (!product) return null;

  //   if (Platform.OS === "android") {
  //     const offer = (product as RNIap.SubscriptionAndroid)
  //     ?.subscriptionOfferDetails?.[0];

  //     return offer.pricingPhases?.pricingPhaseList?.map((phase, index) => {

  //       return {
  //         localizedPrice: phase.formattedPrice,
  //         price: parseInt(phase.priceAmountMicros) / 1000000,
  //         monthlyFormattedPrice: getPrice(product, index, offer?.pricingPhases?.pricingPhaseList?.[1].billingPeriod.endsWith("Y"),
  //       }
  //     })
  //   } else {
  //     return (product as RNIap.SubscriptionIOS)?.pricingPhases;
  //   }

  // }

  return {
    currentPlan: pricingPlans.find((p) => p.id === currentPlan),
    pricingPlans: plans,
    getStandardPrice: getLocalizedPrice,
    loadingPlans,
    loading,
    selectPlan: (planId: string) => {
      setCurrentPlan(planId);
      setSelectedProductSku(
        plans.find((p) => p.id === planId)?.subscriptionSkuList?.[0]
      );
      setIsPromoOffer(false);
    },
    convertYearlyPriceToMonthly: convertPrice,
    getOfferTokenAndroid,
    subscribe,
    selectProduct: setSelectedProductSku,
    selectedProduct: selectedProductSku
      ? getProduct(currentPlan, selectedProductSku)
      : undefined,
    isPromoOffer,
    getPromoCycleText,
    getProduct,
    getProductAndroid,
    getProductIOS,
    hasTrialOffer,
    userCanRequestTrial: userCanRequestTrial,
    cancelPromoOffer: () => setCancelPromo(true),
    getBillingDuration,
    getBillingPeriod,
    getTrialInfo,
    user,
    getPrice,
    compareProductPrice,
    get5YearPlanProduct: () => {
      if (currentPlan === "free" || currentPlan === "essential") return;
      return plans.find((p) => p.id === "pro")?.products?.[
        `notesnook.${currentPlan}.5year`
      ];
    }
  };
};

// const usePricingPlans = (options?: {
//   promo?: {
//     promoCode?: string;
//   };
// }) => {
//   const user = useUserStore((state) => state.user);
//   const [product, setProduct] = useState<{
//     type: string;
//     offerType: "monthly" | "yearly";
//     data: RNIap.Subscription;
//     cycleText: string;
//     info: string;
//   }>();

//   const [buying, setBuying] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const userCanRequestTrial =
//     user && (!user.subscription || !user.subscription.expiry) ? true : false;
//   const yearlyPlan = usePricing("yearly");
//   const monthlyPlan = usePricing("monthly");
//   const promoCode = options?.promo?.promoCode;

//   const getSkus = useCallback(async () => {
//     try {
//       setLoading(true);
//       if (promoCode) {
//         getPromo(promoCode);
//       }
//       setLoading(false);
//     } catch (e) {
//       setLoading(false);
//       console.log("error getting sku", e);
//     }
//   }, [promoCode]);

//   const getPromo = async (code: string) => {
//     try {
//       let skuId: string;
//       if (code.startsWith("com.streetwriters.notesnook")) {
//         skuId = code;
//       } else {
//         skuId = await db.offers?.getCode(
//           code.split(":")[0],
//           Platform.OS as "ios" | "android" | "web"
//         );
//       }

//       const products = await PremiumService.getProducts();
//       const product = products.find((p) => p.productId === skuId);
//       if (!product) return false;
//       const isMonthly = product.productId.indexOf(".mo") > -1;

//       const cycleText = isMonthly
//         ? promoCyclesMonthly[
//             (Platform.OS === "android"
//               ? (product as RNIap.SubscriptionAndroid)
//                   .subscriptionOfferDetails[0]?.pricingPhases
//                   .pricingPhaseList?.[0].billingCycleCount
//               : parseInt(
//                   (product as RNIap.SubscriptionIOS)
//                     .introductoryPriceNumberOfPeriodsIOS as string
//                 )) as keyof typeof promoCyclesMonthly
//           ]
//         : promoCyclesYearly[
//             (Platform.OS === "android"
//               ? (product as RNIap.SubscriptionAndroid)
//                   .subscriptionOfferDetails[0]?.pricingPhases
//                   .pricingPhaseList?.[0].billingCycleCount
//               : parseInt(
//                   (product as RNIap.SubscriptionIOS)
//                     .introductoryPriceNumberOfPeriodsIOS as string
//                 )) as keyof typeof promoCyclesYearly
//           ];

//       setProduct({
//         type: "promo",
//         offerType: isMonthly ? "monthly" : "yearly",
//         data: product,
//         cycleText: cycleText,
//         info: `Pay ${isMonthly ? "monthly" : "yearly"}, cancel anytime`
//       });
//       return true;
//     } catch (e) {
//       console.log("PROMOCODE ERROR:", code, e);
//       return false;
//     }
//   };

//   useEffect(() => {
//     getSkus();
//   }, [getSkus]);

//   const buySubscription = async (product: RNIap.Subscription) => {
//     if (buying || !product) return;
//     setBuying(true);
//     try {
//       if (!user) {
//         setBuying(false);
//         return;
//       }
//       useSettingStore.getState().setAppDidEnterBackgroundForAction(true);
//       const androidOfferToken =
//         Platform.OS === "android"
//           ? (product as RNIap.SubscriptionAndroid).subscriptionOfferDetails[0]
//               .offerToken
//           : null;

//       DatabaseLogger.info(
//         `Subscription Requested initiated for user ${toUUID(user.id)}`
//       );

//       await RNIap.requestSubscription({
//         sku: product?.productId,
//         obfuscatedAccountIdAndroid: user.id,
//         obfuscatedProfileIdAndroid: user.id,
//         appAccountToken: toUUID(user.id),
//         andDangerouslyFinishTransactionAutomaticallyIOS: false,
//         subscriptionOffers: androidOfferToken
//           ? [
//               {
//                 offerToken: androidOfferToken,
//                 sku: product?.productId
//               }
//             ]
//           : undefined
//       });
//       useSettingStore.getState().setAppDidEnterBackgroundForAction(false);
//       setBuying(false);
//       eSendEvent(eCloseSheet);
//       eSendEvent(eClosePremiumDialog);
//       await sleep(500);
//       presentSheet({
//         title: "Thank you for subscribing!",
//         paragraph:
//           "Your Notesnook Pro subscription will be activated soon. If your account is not upgraded to Notesnook Pro, your money will be refunded to you. In case of any issues, please reach out to us at support@streetwriters.co",
//         action: async () => {
//           eSendEvent(eCloseSheet);
//         },
//         icon: "check",
//         actionText: "Continue"
//       });
//     } catch (e) {
//       setBuying(false);
//       console.log(e);
//     }
//   };

//   function getStandardPrice(
//     type: "monthly" | "yearly",
//     product: RNIap.Subscription
//   ) {
//     if (!product) return;
//     const productType = type;

//     if (Platform.OS === "android") {
//       const pricingPhaseListItem = (product as RNIap.SubscriptionAndroid)
//         ?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[1];

//       if (!pricingPhaseListItem) {
//         const product =
//           productType === "monthly"
//             ? monthlyPlan?.product
//             : yearlyPlan?.product;
//         return (product as RNIap.SubscriptionAndroid)
//           ?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]
//           ?.formattedPrice;
//       }

//       return pricingPhaseListItem?.formattedPrice;
//     } else {
//       const productDefault =
//         productType === "monthly" ? monthlyPlan?.product : yearlyPlan?.product;
//       return (
//         (product as RNIap.SubscriptionIOS)?.localizedPrice ||
//         (productDefault as RNIap.SubscriptionIOS)?.localizedPrice
//       );
//     }
//   }

//   return {
//     product,
//     buySubscription,
//     getStandardPrice,
//     loading,
//     userCanRequestTrial,
//     buying,
//     setBuying,
//     setLoading,
//     user,
//     setProduct,
//     monthlyPlan,
//     yearlyPlan,
//     getPromo
//   };
// };

export default usePricingPlans;
