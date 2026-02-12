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
import { Plan, SubscriptionPlan, SubscriptionPlanId } from "@notesnook/core";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Config from "react-native-config";
import * as RNIap from "react-native-iap";
import { DatabaseLogger, db } from "../common/database";
import PremiumService from "../services/premium";
import { useSettingStore } from "../stores/use-setting-store";
import { useUserStore } from "../stores/use-user-store";
import SettingsService from "../services/settings";
function numberWithCommas(x: string) {
  const parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export const PlanOverView = {
  free: {
    storage: `50 MB/mo`,
    fileSize: `1 MB`,
    hdImages: false
  },
  essential: {
    storage: `1 GB`,
    fileSize: `100 MB/mo`,
    hdImages: false
  },
  pro: {
    storage: `10 GB/mo`,
    fileSize: `1 GB`,
    hdImages: true
  },
  believer: {
    storage: `25 GB/mo`,
    fileSize: `5 GB`,
    hdImages: true
  }
};

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
      "notesnook.essential.yearly"
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
      "notesnook.pro.yearly.tier2",
      "notesnook.pro.yearly.tier3"
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
      "notesnook.believer.yearly"
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
const planIdToIndex = (planId: string) => {
  const planIndex = planId === "essential" ? 1 : planId === "pro" ? 2 : 3;
  return planIndex;
};
let WebPlanCache: Plan[];
const usePricingPlans = (options?: PricingPlansOptions) => {
  const isGithubRelease = Config.GITHUB_RELEASE === "true";
  const user = useUserStore((state) => state.user);
  const [currentPlan, setCurrentPlan] = useState<string>(
    options?.planId || pricingPlans[2].id
  );
  const [plans, setPlans] = useState<PricingPlan[]>(pricingPlans);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedProductSku, setSelectedProductSku] = useState<string>(
    options?.productId || "notesnook.pro.yearly"
  );
  const [isPromoOffer, setIsPromoOffer] = useState(false);
  const [cancelPromo, setCancelPromo] = useState(false);
  const [userCanRequestTrial, setUserCanRequestTrial] = useState(false);
  const [webPricingPlans, setWebPricingPlans] = useState<Plan[]>([]);

  const getProduct = (planId: string, skuId: string) => {
    if (isGithubRelease)
      return webPricingPlans.find(
        (plan) => planIdToIndex(planId) === plan.plan && skuId === plan.period
      );

    return (
      plans.find((p) => p.id === planId)?.subscriptions?.[skuId] ||
      plans.find((p) => p.id === planId)?.products?.[skuId]
    );
  };

  const getProductAndroid = (planId: string, skuId: string) => {
    if (isGithubRelease)
      return webPricingPlans.find(
        (plan) => planIdToIndex(planId) === plan.plan && skuId === plan.period
      );
    return getProduct(planId, skuId) as RNIap.SubscriptionAndroid;
  };

  const getProductIOS = (planId: string, skuId: string) => {
    return getProduct(planId, skuId) as RNIap.SubscriptionIOS;
  };

  const hasTrialOffer = (planId?: string, productId?: string) => {
    if (!selectedProductSku && !productId) return false;

    if (productId?.includes("5year")) return false;
    if (isGithubRelease) {
      if (
        user?.subscription?.trialsAvailed?.some(
          (plan) => plan === planIdToIndex(planId || currentPlan)
        )
      ) {
        return false;
      } else {
        return true;
      }
    }

    return Platform.OS === "ios"
      ? (
          getProduct(
            planId || currentPlan,
            productId || selectedProductSku
          ) as RNIap.SubscriptionIOS
        )?.introductoryPricePaymentModeIOS === "FREETRIAL"
      : (
          getProduct(
            planId || currentPlan,
            productId || selectedProductSku
          ) as RNIap.SubscriptionAndroid
        )?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList
          ?.length > 1;
  };

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
      setUserCanRequestTrial(hasTrialOffer());
      if (
        Config.GITHUB_RELEASE === "true" &&
        !SettingsService.getProperty("serverUrls")
      ) {
        try {
          const products = WebPlanCache || (await db.pricing.products());
          WebPlanCache = products;
          setWebPricingPlans(products);
        } catch (e) {}
      }
      setLoadingPlans(false);
    };
    loadPlans();
  }, [options?.promoOffer, cancelPromo]);

  function getLocalizedPrice(
    product: RNIap.Subscription | RNIap.Product | Plan
  ) {
    if (!product) return;

    if (Platform.OS === "android") {
      if (isGithubRelease) {
        if (!(product as Plan)?.price) return null;
        return `${
          (product as Plan).currencySymbol || (product as Plan).currency
        } ${
          (product as Plan).period === "yearly"
            ? (product as Plan).price.gross
            : (product as Plan).period === "5-year"
              ? (product as Plan).price.gross
              : (product as Plan).price.gross
        }`;
      }

      const pricingPhaseListItem =
        (product as RNIap.SubscriptionAndroid)?.subscriptionOfferDetails?.[0]
          ?.pricingPhases?.pricingPhaseList?.[1] ||
        (product as RNIap.SubscriptionAndroid)?.subscriptionOfferDetails?.[0]
          ?.pricingPhases?.pricingPhaseList?.[0];

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
    return (product as RNIap.SubscriptionAndroid)?.subscriptionOfferDetails?.[
      offerIndex
    ].offerToken;
  }

  async function subscribe(
    product: RNIap.Subscription | RNIap.Product,
    androidOfferToken?: string
  ) {
    if (loading || !product || isGithubRelease) return;
    setLoading(true);
    try {
      if (!user) {
        setLoading(false);
        return;
      }
      useSettingStore.getState().setAppDidEnterBackgroundForAction(true);

      if (!product.productId.includes("5year")) {
        if (Platform.OS === "android") {
          androidOfferToken =
            (
              product as RNIap.SubscriptionAndroid
            )?.subscriptionOfferDetails.find(
              (offer) => offer.offerToken === androidOfferToken
            )?.offerToken ||
            (product as RNIap.SubscriptionAndroid)
              ?.subscriptionOfferDetails?.[0].offerToken;

          if (!androidOfferToken) return;
        }

        DatabaseLogger.info(
          `Subscription Requested initiated for user ${toUUID(user.id)}`
        );

        await RNIap.requestSubscription({
          sku: product?.productId,
          obfuscatedAccountIdAndroid: user.id,
          obfuscatedProfileIdAndroid: user.id,
          purchaseTokenAndroid:
            user.subscription?.plan !== SubscriptionPlan.FREE
              ? user.subscription?.googlePurchaseToken || undefined
              : undefined,
          replacementModeAndroid: user.subscription?.googlePurchaseToken
            ? RNIap.ReplacementModesAndroid.WITH_TIME_PRORATION
            : undefined,

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
        if (
          (product as RNIap.SubscriptionIOS).introductoryPricePaymentModeIOS ===
          "FREETRIAL"
        ) {
          PremiumService.subscriptions.setTrialStatus(true);
        }
      } else {
        await RNIap.requestPurchase({
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
          appAccountToken: toUUID(user.id),
          obfuscatedAccountIdAndroid: user.id,
          obfuscatedProfileIdAndroid: user.id,
          sku: product.productId,
          skus: [product.productId],
          quantity: 1
        });
      }
      useSettingStore.getState().setAppDidEnterBackgroundForAction(false);
      setLoading(false);
      options?.onBuy?.();
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  }

  function getPromoCycleText(product: RNIap.Subscription) {
    if (!selectedProductSku) return;
    const isMonthly = selectedProductSku?.indexOf(".monthly") > -1;

    const cycleText = isMonthly
      ? promoCyclesMonthly[
          (Platform.OS === "android"
            ? (product as RNIap.SubscriptionAndroid)
                ?.subscriptionOfferDetails[0]?.pricingPhases
                .pricingPhaseList?.[0].billingCycleCount
            : parseInt(
                (product as RNIap.SubscriptionIOS)
                  .introductoryPriceNumberOfPeriodsIOS as string
              )) as keyof typeof promoCyclesMonthly
        ]
      : promoCyclesYearly[
          (Platform.OS === "android"
            ? (product as RNIap.SubscriptionAndroid)
                ?.subscriptionOfferDetails[0]?.pricingPhases
                .pricingPhaseList?.[0].billingCycleCount
            : parseInt(
                (product as RNIap.SubscriptionIOS)
                  .introductoryPriceNumberOfPeriodsIOS as string
              )) as keyof typeof promoCyclesYearly
        ];

    return cycleText;
  }

  const getBillingPeriod = (
    product: RNIap.Subscription | Plan,
    offerIndex: number
  ) => {
    if (isGithubRelease) {
      return (product as Plan)?.period;
    }

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
    product: RNIap.Subscription | Plan,
    offerIndex: number,
    phaseIndex: number,
    trialDurationIos?: boolean
  ) => {
    if (!product) return;

    if (isGithubRelease) {
      return {
        duration: 1,
        type: (product as Plan)?.period
      };
    }

    if ((product as RNIap.Subscription)?.productId.includes("5year")) {
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
        ?.subscriptionOfferDetails?.[0];
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
      const androidPricingPhase1 =
        (p1 as RNIap.SubscriptionAndroid)?.subscriptionOfferDetails?.[0]
          .pricingPhases?.pricingPhaseList?.[1] ||
        (p1 as RNIap.SubscriptionAndroid)?.subscriptionOfferDetails?.[0]
          .pricingPhases?.pricingPhaseList?.[0];
      const androidPricingPhase2 =
        (p2 as RNIap.SubscriptionAndroid)?.subscriptionOfferDetails?.[0]
          .pricingPhases?.pricingPhaseList?.[1] ||
        (p2 as RNIap.SubscriptionAndroid)?.subscriptionOfferDetails?.[0]
          .pricingPhases?.pricingPhaseList?.[0];

      if (!androidPricingPhase1 || !androidPricingPhase2) return 0;

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
    product: RNIap.Subscription | RNIap.Product | Plan,
    phaseIndex: number,
    annualBilling?: boolean
  ) => {
    if (!product) return null;

    if (isGithubRelease) {
      if (!(product as Plan)?.price) return null;
      return `${
        (product as Plan).currencySymbol || (product as Plan).currency
      } ${
        (product as Plan).period === "yearly"
          ? ((product as Plan).price.gross / 12).toFixed(2)
          : (product as Plan).period === "5-year"
            ? ((product as Plan).price.gross / (12 * 5)).toFixed(2)
            : (product as Plan).price.gross
      }`;
    }

    const androidPricingPhase = (product as RNIap.SubscriptionAndroid)
      ?.subscriptionOfferDetails?.[0].pricingPhases?.pricingPhaseList?.[
      phaseIndex
    ];

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

    return !annualBilling &&
      !(product as RNIap.Subscription)?.productId.includes("5year")
      ? getLocalizedPrice(product as RNIap.Subscription)
      : convertPrice(
          priceValue,
          priceSymbol,
          localizedPrice.startsWith(priceSymbol),
          annualBilling ? 12 : 60
        );
  };

  async function getRegionalDiscount(plan: string, productId: string) {
    if (productId !== "notesnook.pro.yearly") {
      return;
    }
    try {
      return await db.pricing.sku(
        Platform.OS === "android" ? "google" : "apple",
        "yearly",
        plan as SubscriptionPlanId
      );
    } catch (e) {
      console.log(e);
    }
  }

  function isSubscribedToPlan(planId: string) {
    if (!PremiumService.get()) return false;
    return user?.subscription?.productId?.includes(planId);
  }

  function isSubscribedToProduct(productId: string) {
    if (!PremiumService.get()) return false;
    return (
      user?.subscription?.productId &&
      (user?.subscription?.productId === productId ||
        user?.subscription?.productId?.startsWith(productId))
    );
  }

  return {
    currentPlan: pricingPlans.find((p) => p.id === currentPlan),
    pricingPlans: plans,
    isSubscribedToPlan,
    isSubscribedToProduct,
    getStandardPrice: getLocalizedPrice,
    loadingPlans,
    loading,
    selectPlan: (planId: string, productId?: string) => {
      setCurrentPlan(planId);
      if (productId) {
        console.log(productId, "productId");
        setSelectedProductSku(productId);
      } else {
        const product = plans.find((p) => p.id === planId)
          ?.subscriptionSkuList?.[0];
        if (product) {
          setSelectedProductSku(product);
        }
      }

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
    },
    getWebPlan(plan: string, period: "monthly" | "yearly") {
      const planIndex = planIdToIndex(plan);
      return webPricingPlans.find(
        (plan) => plan.plan === planIndex && plan.period === period
      );
    },
    getRegionalDiscount,
    isGithubRelease: isGithubRelease,
    isSubscribed: () => user?.subscription?.plan !== SubscriptionPlan.FREE,
    finish: () => options?.onBuy?.()
  };
};

export default usePricingPlans;
