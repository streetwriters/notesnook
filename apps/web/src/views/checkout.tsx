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

import "../app.css";
import { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import Field from "../components/field";
import { hardNavigate, useQueryParams } from "../navigation";
import {
  Coupon,
  Loading,
  CheckCircle,
  ArrowLeft,
  Cloud,
  ShieldCheck,
  DeviceMobileCamera,
  Info,
  CheckCircleSuccess
} from "../components/icons";
import { HeadlessAuth } from "./auth";
import { CheckoutDetails } from "../dialogs/buy-dialog";
import { useCheckoutStore } from "../dialogs/buy-dialog/store";
import { useStore as useUserStore } from "../stores/user-store";
import { z } from "zod";
import {
  FEATURE_HIGHLIGHTS,
  toPricingInfo,
  formatPrice
} from "../dialogs/buy-dialog/helpers";
import { isUserSubscribed } from "../hooks/use-is-user-premium";
import { PLAN_METADATA, PERIOD_METADATA } from "../dialogs/buy-dialog/plans";
import { getFeature, planToAvailability } from "@notesnook/common";
import dayjs from "dayjs";
import { EVENTS } from "@notesnook/core";
import { db } from "../common/db";

export type Plan = z.infer<typeof PlanSchema>;

const PlanSchema = z.object({
  id: z.string(),
  period: z.enum(["yearly", "monthly", "5-year"]),
  plan: z.number(),
  recurring: z.boolean(),
  price: z.object({
    gross: z.number(),
    net: z.number(),
    tax: z.number(),
    currency: z.string().optional()
  }),
  currency: z.string(),
  currencySymbol: z.string().optional(),
  originalPrice: z
    .object({
      gross: z.number(),
      net: z.number(),
      tax: z.number(),
      currency: z.string().optional()
    })
    .optional(),
  discount: z
    .object({
      type: z.enum(["regional", "promo"]),
      code: z.string().optional(),
      recurring: z.boolean(),
      amount: z.number()
    })
    .optional(),
  country: z.string(),
  transactionId: z.string().optional(),
  customer: z
    .object({
      id: z.string(),
      email: z.string()
    })
    .optional()
});

const CHECKOUT_STEP = {
  ACCOUNT: "Account",
  PAYMENT: "Payment",
  COMPLETE: "Complete"
} as const;

type CheckoutStep = (typeof CHECKOUT_STEP)[keyof typeof CHECKOUT_STEP];

function Checkout() {
  const [{ plan }] = useQueryParams();
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    CHECKOUT_STEP.ACCOUNT
  );
  const [error, setError] = useState<string>();
  const [customer, setCustomer] = useState<{ id: string; email: string }>();

  useEffect(() => {
    useUserStore.getState().init();
  }, []);

  useEffect(() => {
    if (!plan) return;

    const pricingInfo = PlanSchema.safeParse(
      JSON.parse(Buffer.from(plan, "base64").toString("utf-8"))
    );
    if (!pricingInfo.success) {
      hardNavigate("/");
      return;
    }
    useCheckoutStore.getState().selectPlan(pricingInfo.data);
    useCheckoutStore
      .getState()
      .updatePrice(
        toPricingInfo(pricingInfo.data, useUserStore.getState().user)
      );
    useCheckoutStore.getState().applyCoupon(pricingInfo.data.discount?.code);
    if (pricingInfo.data.customer) {
      setCustomer(pricingInfo.data.customer);
      setCurrentStep(CHECKOUT_STEP.PAYMENT);
    }
  }, [plan]);

  useEffect(() => {
    if (currentStep === CHECKOUT_STEP.COMPLETE) {
      const event = db.eventManager.subscribe(
        EVENTS.userSubscriptionUpdated,
        () => {
          hardNavigate("/notes#/welcome");
        }
      );
      return () => {
        event.unsubscribe();
      };
    }
  }, [currentStep]);

  if (!plan) {
    hardNavigate("/");
    return null;
  }

  return (
    <Flex
      sx={{
        bg: "background",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto"
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          px: "spacing13",
          py: "spacing8"
        }}
      >
        <Flex sx={{ alignItems: "center", gap: "spacing7" }}>
          {currentStep === CHECKOUT_STEP.COMPLETE ? null : (
            <Button>
              <ArrowLeft
                size={20}
                color="icon"
                onClick={() => hardNavigate("/plans")}
              />
            </Button>
          )}
          <Flex
            sx={{ alignItems: "center", justifyContent: "center", gap: "12px" }}
          >
            <svg
              style={{
                borderRadius: "default",
                height: 30,
                width: 30
              }}
            >
              <use href="#full-logo" />
            </svg>
            <Text
              sx={{
                fontSize: "2xl",
                color: "heading",
                fontWeight: 600,
                lineHeight: "120%",
                letterSpacing: "-0.88px"
              }}
            >
              Notesnook
            </Text>
          </Flex>
        </Flex>
        <Button variant="new_bordered" sx={{ px: "16px" }}>
          <span>Contact</span>
        </Button>
      </Flex>
      {currentStep === CHECKOUT_STEP.COMPLETE ? (
        <Flex
          sx={{
            flex: 1,
            justifyContent: "center",
            my: "spacing9"
          }}
        >
          <CheckoutSuccessCard
            selectedPlan={selectedPlan}
            onClose={() => hardNavigate("/notes")}
          />
        </Flex>
      ) : (
        <Flex
          sx={{
            flex: 1,
            mx: "100px",
            my: "spacing9",
            gap: "32px"
          }}
        >
          <Flex
            sx={{
              flex: 1,
              flexDirection: "column",
              gap: "spacing11",
              bg: "background",
              border: "1px solid var(--border-secondary)",
              borderRadius: "radius4",
              boxShadow: "0px 4px 25px rgba(0,0,0,0.05)",
              px: "32px",
              py: "spacing11"
            }}
          >
            <Flex
              sx={{
                justifyContent: "center",
                alignItems: "center",
                gap: "spacing7"
              }}
            >
              {[CHECKOUT_STEP.ACCOUNT, CHECKOUT_STEP.PAYMENT].map(
                (step, index) => (
                  <>
                    <Flex key={step} sx={{ alignItems: "center", gap: "12px" }}>
                      <Flex
                        sx={{
                          bg:
                            currentStep >= step
                              ? "accent"
                              : "background-secondary",
                          height: 24,
                          width: 24,
                          borderRadius: 100,
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Text
                          sx={{
                            fontSize: "sm",
                            fontWeight: 600,
                            color:
                              currentStep >= step
                                ? "accentForeground"
                                : "heading-secondary",
                            textAlign: "center"
                          }}
                        >
                          {index + 1}
                        </Text>
                      </Flex>
                      <Text
                        sx={{
                          color: "heading",
                          fontSize: "sm",
                          fontWeight: 500
                        }}
                      >
                        {step}
                      </Text>
                    </Flex>
                    {index <
                    [CHECKOUT_STEP.ACCOUNT, CHECKOUT_STEP.PAYMENT].length -
                      1 ? (
                      <Box
                        sx={{
                          display: ["none", "none", "block"],
                          height: 2,
                          width: 100,
                          bg: "separator"
                        }}
                      />
                    ) : null}
                  </>
                )
              )}
            </Flex>

            <Flex
              sx={{
                flex: 1,
                // pr: 300,
                position: "relative",
                overflow: "hidden",
                m: 2,
                gap: 2,
                ".auth-scroll-container form": {
                  width: ["95%", "95%", "35%"]
                }
              }}
            >
              {currentStep === CHECKOUT_STEP.ACCOUNT ? (
                <HeadlessAuth
                  route="signup"
                  canSkip={false}
                  isolated
                  openURL={async (url, ctx) => {
                    if (ctx?.authenticated) {
                      await useUserStore.getState().init();
                      const user = useUserStore.getState().user;
                      setCustomer(user);
                      setCurrentStep(
                        isUserSubscribed(user)
                          ? CHECKOUT_STEP.COMPLETE
                          : CHECKOUT_STEP.PAYMENT
                      );
                    } else setError("Failed to create account.");
                  }}
                />
              ) : currentStep === CHECKOUT_STEP.PAYMENT ? (
                <Flex
                  sx={{ flexDirection: "column", overflow: "hidden", flex: 1 }}
                >
                  <Text
                    sx={{ color: "heading", fontSize: "2xl", fontWeight: 600 }}
                  >
                    Final step, make the payment.
                  </Text>
                  <Text
                    variant="body"
                    sx={{
                      fontSize: "sm",
                      color: "paragraph",
                      mt: "spacing3",
                      mb: "spacing11"
                    }}
                  >
                    You are one step away from unlocking the full potential of
                    Notesnook.
                  </Text>
                  <CheckoutDetails
                    user={customer}
                    onComplete={() => {
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(
                          JSON.stringify({
                            success: true
                          })
                        );
                      } else {
                        setCurrentStep(CHECKOUT_STEP.COMPLETE);
                      }
                    }}
                  />
                </Flex>
              ) : null}
            </Flex>
          </Flex>
          <Flex
            sx={{
              display: ["none", "none", "flex"],
              // width: "300px",
              flexBasis: "40%",
              flexDirection: "column",
              justifyContent: "space-between",
              bg: "background"
            }}
          >
            <CheckoutSummary />
          </Flex>
        </Flex>
      )}

      {currentStep === CHECKOUT_STEP.COMPLETE ? null : (
        <Flex
          sx={{
            display: ["flex", "flex", "none"],
            width: "100%",
            bg: "background",
            zIndex: 999,
            p: 3,
            flexDirection: "column"
          }}
        >
          <CheckoutSummaryMobile />
        </Flex>
      )}
    </Flex>
  );
}
export default Checkout;

type CheckoutSuccessCardProps = {
  selectedPlan?: Plan;
  onClose: () => void;
};

function CheckoutSuccessCard(props: CheckoutSuccessCardProps) {
  const { selectedPlan, onClose } = props;

  if (!selectedPlan) return null;

  const storageCaption =
    getFeature("storage").availability[planToAvailability(selectedPlan.plan)]
      .caption;

  const features = [
    {
      icon: <Cloud size={15} color="icon" />,
      title: "Cloud Storage",
      value: storageCaption
    },
    {
      icon: <ShieldCheck size={15} color="icon" />,
      title: "Encryption",
      value: "AES-256 Zero Know"
    },
    {
      icon: <DeviceMobileCamera size={15} color="icon" />,
      title: "Device Sync",
      value: "Unlimited Sync"
    },
    {
      icon: <Info size={15} color="icon" />,
      title: "VIP Support",
      value: "Prioritized Priority"
    }
  ];

  return (
    <Flex
      sx={{
        width: "100%",
        maxWidth: "562px",
        height: "fit-content",
        flexDirection: "column",
        gap: "spacing6",
        alignItems: "center",
        justifyContent: "center",
        bg: "background",
        border: "1px solid var(--border)",
        borderRadius: "radius4",
        boxShadow: "0px 4px 25px rgba(0,0,0,0.04)",
        p: "spacing7"
      }}
    >
      <Flex
        sx={{
          width: "100%",
          flexDirection: "column",
          gap: "spacing7",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Flex
          sx={{
            width: "100%",
            flexDirection: "column",
            gap: "spacing11",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <CheckCircleSuccess size={60} color="accent" />
          <Flex
            sx={{
              width: "100%",
              flexDirection: "column",
              gap: "spacing6",
              alignItems: "center",
              textAlign: "center"
            }}
          >
            <Text
              sx={{
                color: "heading",
                fontSize: "2xl",
                fontWeight: 600,
                lineHeight: 1
              }}
            >
              Payment Confirmed!
            </Text>
            <Text
              sx={{
                color: "paragraph",
                fontSize: "sm",
                fontWeight: 400,
                lineHeight: 1.5
              }}
            >
              Your premium workspace is ready. Enjoy secure note-taking,
              seamless syncing, and a distraction-free writing experience across
              all your devices.
            </Text>
          </Flex>
        </Flex>
        <Flex
          sx={{
            width: "100%",
            flexDirection: "column",
            gap: "spacing6",
            bg: "background-secondary",
            p: "spacing7",
            borderRadius: "radius4"
          }}
        >
          <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Text
              sx={{
                color: "heading",
                fontSize: "lg",
                fontWeight: 600,
                lineHeight: 1
              }}
            >
              Active Membership
            </Text>
            <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 100,
                  bg: "accent"
                }}
              />
              <Text
                sx={{
                  color: "accent",
                  fontSize: "sm",
                  fontWeight: 600,
                  lineHeight: 1
                }}
              >
                {
                  PLAN_METADATA[selectedPlan.plan as keyof typeof PLAN_METADATA]
                    .title
                }{" "}
                Plan
              </Text>
            </Flex>
          </Flex>
          <Box sx={{ height: 1, width: "100%", bg: "separator" }} />
          <Flex sx={{ width: "100%", flexWrap: "wrap", rowGap: "spacing6" }}>
            {features.map((feature) => (
              <Flex
                key={feature.title}
                sx={{
                  width: ["100%", "50%"],
                  gap: "spacing4",
                  alignItems: "flex-start"
                }}
              >
                {feature.icon}
                <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
                  <Text
                    sx={{
                      color: "paragraph-primary",
                      fontSize: "xs",
                      fontWeight: 400,
                      lineHeight: 1
                    }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    sx={{
                      color: "heading",
                      fontSize: "sm",
                      fontWeight: 500,
                      lineHeight: 1
                    }}
                  >
                    {feature.value}
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Flex>
      <Button
        variant="new_accent"
        onClick={onClose}
        sx={{
          width: "100%",
          px: "spacing4",
          py: "spacing5",
          fontSize: "sm"
        }}
      >
        Start taking notes securely
      </Button>
    </Flex>
  );
}

function CheckoutSummaryMobile() {
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);
  const isApplyingCoupon = useCheckoutStore((state) => state.isApplyingCoupon);
  const couponCode = useCheckoutStore((state) => state.couponCode);
  const applyCoupon = useCheckoutStore((state) => state.applyCoupon);
  const setIsApplyingCoupon = useCheckoutStore(
    (state) => state.setIsApplyingCoupon
  );

  if (!selectedPlan || !pricingInfo) return null;
  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: "spacing8"
      }}
    >
      <Text
        sx={{
          fontSize: "sm",
          fontWeight: 400,
          color: "heading-secondary",
          lineHeight: "100%"
        }}
      >
        Payment Summary
      </Text>
      <SummaryContent
        selectedPlan={selectedPlan}
        pricingInfo={pricingInfo}
        isApplyingCoupon={isApplyingCoupon}
        couponCode={couponCode}
        applyCoupon={applyCoupon}
        setIsApplyingCoupon={setIsApplyingCoupon}
      />
    </Flex>
  );
}

function CheckoutSummary() {
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);
  const isApplyingCoupon = useCheckoutStore((state) => state.isApplyingCoupon);
  const couponCode = useCheckoutStore((state) => state.couponCode);
  const applyCoupon = useCheckoutStore((state) => state.applyCoupon);
  const setIsApplyingCoupon = useCheckoutStore(
    (state) => state.setIsApplyingCoupon
  );

  if (!selectedPlan || !pricingInfo) return null;
  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: "24px"
      }}
    >
      <Text
        sx={{
          fontSize: "sm",
          fontWeight: 400,
          color: "heading-secondary",
          lineHeight: "100%"
        }}
      >
        Payment Summary
      </Text>
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing8",
          bg: "background",
          border: "1px solid var(--border-secondary)",
          borderRadius: "radius4",
          boxShadow: "0px 4px 25px rgba(0,0,0,0.05)",
          px: "32px",
          py: "spacing11"
        }}
      >
        <SummaryContent
          selectedPlan={selectedPlan}
          pricingInfo={pricingInfo}
          isApplyingCoupon={isApplyingCoupon}
          couponCode={couponCode}
          applyCoupon={applyCoupon}
          setIsApplyingCoupon={setIsApplyingCoupon}
        />
      </Flex>
    </Flex>
  );
}

type SummaryContentProps = {
  selectedPlan: Plan;
  pricingInfo: NonNullable<
    ReturnType<typeof useCheckoutStore.getState>["pricingInfo"]
  >;
  isApplyingCoupon: boolean;
  couponCode?: string;
  applyCoupon: (code?: string) => void;
  setIsApplyingCoupon: (v: boolean) => void;
};

function SummaryContent(props: SummaryContentProps) {
  const {
    selectedPlan,
    pricingInfo,
    isApplyingCoupon,
    couponCode,
    applyCoupon,
    setIsApplyingCoupon
  } = props;
  const { price } = pricingInfo;

  const [couponInputValue, setCouponInputValue] = useState("");
  const couponInputRef = useRef<HTMLInputElement>(null);

  // keep the displayed value in sync when a coupon gets applied/removed elsewhere
  useEffect(() => {
    if (couponCode) setCouponInputValue(couponCode);
  }, [couponCode]);

  return (
    <>
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing3",
          alignItems: "flex-start"
        }}
      >
        <Text
          sx={{
            fontSize: "2xl",
            fontWeight: 600,
            color: "heading",
            lineHeight: "100%"
          }}
        >
          {PLAN_METADATA[selectedPlan.plan as keyof typeof PLAN_METADATA].title}{" "}
          Plan
        </Text>
        <Text
          sx={{
            fontWeight: 400,
            fontSize: "sm",
            color: "paragraph-primary",
            lineHeight: "100%"
          }}
        >
          {PERIOD_METADATA[selectedPlan.period].title} Billing
        </Text>
      </Flex>

      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing7",
          mt: "15px"
        }}
      >
        {FEATURE_HIGHLIGHTS.map((feature) => {
          const caption: string | number | boolean =
            feature.availability[planToAvailability(selectedPlan.plan)].caption;
          return (
            <Flex
              key={feature.id}
              sx={{
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <Text
                sx={{
                  fontSize: "sm",
                  color: "paragraph",
                  lineHeight: "100%",
                  fontWeight: 400
                }}
              >
                {feature.title}
              </Text>
              {typeof caption === "boolean" || caption === "infinity" ? (
                <CheckCircle size={20} color="accent" />
              ) : (
                <Text
                  sx={{
                    fontSize: "sm",
                    color: "heading",
                    lineHeight: "100%",
                    fontWeight: 500
                  }}
                >
                  {caption}
                </Text>
              )}
            </Flex>
          );
        })}
      </Flex>

      <Box sx={{ height: 1, bg: "separator" }} />

      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing7"
        }}
      >
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Text
            sx={{
              fontSize: "sm",
              color: "paragraph",
              lineHeight: "100%",
              fontWeight: 400
            }}
          >
            Today
          </Text>
          <Text
            sx={{
              fontSize: "sm",
              fontWeight: 600,
              color: "accent",
              lineHeight: "100%"
            }}
          >
            {price.trial_period
              ? formatPrice(0, price.currency)
              : price.subtotal}
          </Text>
        </Flex>

        {price.trial_period ? (
          <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 400,
                color: "paragraph",
                lineHeight: "100%"
              }}
            >
              After {price.trial_period.frequency} days
            </Text>
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 500,
                color: "heading",
                lineHeight: "100%"
              }}
            >
              {price.subtotal}
            </Text>
          </Flex>
        ) : null}

        {pricingInfo.recurringPrice ? (
          <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Text
              sx={{
                fontSize: "sm",
                color: "paragraph-secondary",
                lineHeight: "100%",
                fontWeight: 400
              }}
            >
              {pricingInfo.period === "monthly"
                ? "Next Month"
                : pricingInfo.period === "yearly"
                ? "Next Year"
                : dayjs()
                    .add(pricingInfo.period === "5-year" ? 5 : 1, "year")
                    .add(price.trial_period?.frequency || 0, "days")
                    .format("YYYY-MM-DD")}
            </Text>
            <Text
              sx={{
                fontSize: "sm",
                color: "paragraph-secondary",
                lineHeight: "100%"
              }}
            >
              {pricingInfo.recurringPrice.subtotal}
            </Text>
          </Flex>
        ) : null}
      </Flex>

      <Box sx={{ height: 1, bg: "separator" }} />

      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text
          sx={{
            fontSize: "md",
            fontWeight: 500,
            color: "heading",
            lineHeight: "100%"
          }}
        >
          Total for today
        </Text>
        <Text
          sx={{
            fontSize: "lg",
            fontWeight: 600,
            color: "heading",
            lineHeight: "100%"
          }}
        >
          {price.trial_period ? formatPrice(0, price.currency) : price.total}
        </Text>
      </Flex>

      <Box sx={{ height: 1, bg: "separator" }} />

      <Field
        key={couponCode ? "applied" : "empty"}
        inputRef={couponInputRef}
        placeholder="Enter coupon code"
        defaultValue={couponCode ?? couponInputValue}
        disabled={!!couponCode}
        onChange={(e) => setCouponInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && couponInputValue.trim()) {
            setIsApplyingCoupon(true);
            applyCoupon(couponInputValue.trim());
          }
        }}
        sx={{
          border: "1px solid var(--border)",
          borderRadius: "radius2",
          height: "spacing13",
          overflow: "hidden"
        }}
        styles={{
          input: {
            border: "none",
            outline: "none !important",
            bg: "transparent",
            fontSize: "lg",
            color: "paragraph-primary",
            pl: "38px",
            pr: "85px",
            lineHeight: "100%"
          }
        }}
        leftActions={[
          {
            testId: "coupon-icon",
            disabled: true,
            sx: {
              width: "38px",
              pl: "spacing5",
              pr: "spacing4",
              justifyContent: "flex-start",
              bg: "transparent"
            },
            component: <Coupon size={15} color="icon" />
          }
        ]}
        rightActions={[
          {
            testId: couponCode ? "remove-coupon-button" : "apply-coupon-button",
            disabled:
              isApplyingCoupon || (!couponCode && !couponInputValue.trim()),
            onClick: () => {
              setIsApplyingCoupon(true);
              if (couponCode) {
                applyCoupon(undefined);
                setCouponInputValue("");
              } else {
                applyCoupon(couponInputValue.trim());
              }
            },
            sx: {
              // width: "85px",
              // minWidth: "85px",
              px: 0,
              bg: "accent",
              borderRadius: "radius2"
            },
            component: (
              <Button
                variant="new_accent"
                sx={{
                  fontSize: "md",
                  fontWeight: 600,
                  p: "spacing6",
                  lineHeight: "100%",
                  borderRadius: "radius2"
                }}
              >
                {isApplyingCoupon ? (
                  <Loading size={18} />
                ) : couponCode ? (
                  "Remove"
                ) : (
                  "Apply"
                )}
              </Button>
            )
          }
        ]}
      />
    </>
  );
}
