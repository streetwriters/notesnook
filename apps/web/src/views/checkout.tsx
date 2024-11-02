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
import { useEffect, useState } from "react";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { hardNavigate, useQueryParams } from "../navigation";
import { Check, Coupon, Support } from "../components/icons";
import { HeadlessAuth } from "./auth";
import {
  CheckoutCompleted,
  CheckoutDetails,
  CheckoutPricing
} from "../dialogs/buy-dialog";
import { useCheckoutStore } from "../dialogs/buy-dialog/store";
import { useStore as useUserStore } from "../stores/user-store";
import { z } from "zod";
import { PricingInfo } from "../dialogs/buy-dialog/types";
import IconTag from "../components/icon-tag";
import { SUBSCRIPTION_STATUS } from "../common/constants";

export type Period = "yearly" | "monthly" | "education";
export type Plan = z.infer<typeof PlanSchema>;

const PlanSchema = z.object({
  id: z.string(),
  period: z.enum(["yearly", "monthly", "education"]),
  price: z.object({
    gross: z.number(),
    net: z.number(),
    tax: z.number(),
    currency: z.string().optional()
  }),
  currency: z.string(),
  currencySymbol: z.string().optional(),
  originalPrice: z.object({
    gross: z.number(),
    net: z.number(),
    tax: z.number(),
    currency: z.string().optional()
  }),
  discount: z
    .object({
      type: z.enum(["regional", "promo"]),
      code: z.string().optional(),
      recurring: z.boolean(),
      amount: z.number()
    })
    .optional(),
  country: z.string()
});

function toPricingInfo(plan: Plan): PricingInfo {
  return {
    country: plan.country,
    currency: plan.currency,
    discount: plan.discount
      ? {
          amount: plan.originalPrice.gross - plan.price.gross,
          recurring: plan.discount.recurring,
          type: plan.discount.type,
          code: plan.discount.code
        }
      : { amount: 0, recurring: false, type: "promo" },
    period: plan.period,
    price: plan.originalPrice,
    recurringPrice: plan.originalPrice,
    coupon: plan.discount?.code,
    invalidCoupon: false
  };
}

const CHECKOUT_STEPS = ["Account", "Payment", "Complete"];
function Checkout() {
  const [{ plan }] = useQueryParams();

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string>();
  const user = useUserStore((store) => store.user);
  const isCheckoutCompleted = useCheckoutStore((store) => store.isCompleted);

  useEffect(() => {
    if (isCheckoutCompleted) {
      setCurrentStep(2);
    }
  }, [isCheckoutCompleted]);

  useEffect(() => {
    useUserStore.getState().init();
  }, []);

  useEffect(() => {
    const pricingInfo = PlanSchema.safeParse(
      JSON.parse(Buffer.from(plan, "base64").toString("utf-8"))
    );
    if (!pricingInfo.success) {
      hardNavigate("/");
      return;
    }
    useCheckoutStore.getState().selectPlan(pricingInfo.data);
    useCheckoutStore.getState().updatePrice(toPricingInfo(pricingInfo.data));
    useCheckoutStore.getState().applyCoupon(pricingInfo.data.discount?.code);
  }, [plan]);

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
          px: 2
        }}
      >
        <Flex sx={{ alignItems: "center", justifyContent: "center", gap: 2 }}>
          <svg
            style={{
              borderRadius: "default",
              height: 50,
              width: 30,
              alignSelf: "start"
            }}
          >
            <use href="#full-logo" />
          </svg>
          <Text variant="heading" sx={{ fontSize: 20 }}>
            Notesnook
          </Text>
        </Flex>
        <Button
          variant="secondary"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Support size={18} />
          <span>Contact support</span>
        </Button>
      </Flex>
      <Flex sx={{ flex: 1 }}>
        <Flex sx={{ flexDirection: "column", flex: 1 }}>
          <Flex
            sx={{
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              mt: 2,
              pb: 2
            }}
          >
            {CHECKOUT_STEPS.map((step, index) => (
              <>
                <Flex key={step} sx={{ alignItems: "center", gap: 2 }}>
                  <Flex
                    sx={{
                      bg:
                        currentStep >= index
                          ? "accent"
                          : "background-secondary",
                      height: 25,
                      width: 25,
                      borderRadius: 100,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Text
                      variant="subBody"
                      sx={{
                        color:
                          currentStep >= index
                            ? "accentForeground"
                            : "paragraph-secondary",
                        textAlign: "center"
                      }}
                    >
                      {index + 1}
                    </Text>
                  </Flex>
                  <Text variant="body">{step}</Text>
                </Flex>
                {index < CHECKOUT_STEPS.length - 1 ? (
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
            ))}
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
            {currentStep === 0 ? (
              <HeadlessAuth
                route="signup"
                canSkip={false}
                isolated
                openURL={async (url, ctx) => {
                  if (ctx?.authenticated) {
                    await useUserStore.getState().init();
                    const user = useUserStore.getState().user;
                    setCurrentStep(
                      user?.subscription.type === SUBSCRIPTION_STATUS.PREMIUM
                        ? 2
                        : 1
                    );
                  } else setError("Failed to create account.");
                }}
              />
            ) : currentStep === 1 ? (
              <Flex
                sx={{ flexDirection: "column", overflow: "hidden", flex: 1 }}
              >
                <Text variant="heading" sx={{ mx: 2 }}>
                  Final step, make the payment.
                </Text>
                <Text
                  variant="body"
                  sx={{
                    mx: 2,
                    fontSize: "title",
                    color: "paragraph-secondary",
                    mt: 1,
                    mb: 4
                  }}
                >
                  You are one step away from unlocking the full potential of
                  Notesnook.
                </Text>
                <CheckoutDetails user={user} />
              </Flex>
            ) : currentStep === 2 ? (
              <Flex
                sx={{
                  flexDirection: "column",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <CheckoutCompleted
                  onClose={() => hardNavigate("/notes")}
                  buttonText="Start your journey"
                />
              </Flex>
            ) : null}
          </Flex>
        </Flex>
        {currentStep === 2 ? null : (
          <Flex
            sx={{
              display: ["none", "none", "flex"],
              width: "300px",
              border: "1px solid var(--border)",
              borderTop: "none",
              p: 3,
              flexDirection: "column",
              justifyContent: "space-between",
              bg: "background"
            }}
          >
            <CheckoutSummary />
          </Flex>
        )}
      </Flex>

      {currentStep === 2 ? null : (
        <Flex
          sx={{
            display: ["flex", "flex", "none"],
            width: "100%",
            bg: "background",
            zIndex: 999,
            borderTop: "1px solid var(--border)",
            p: 3,
            flexDirection: "column",
            mt: 4
          }}
        >
          <CheckoutSummaryMobile />
        </Flex>
      )}
    </Flex>
  );
}
export default Checkout;

function CheckoutSummaryMobile() {
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);
  const couponCode = useCheckoutStore((store) => store.couponCode);

  console.log(pricingInfo);
  if (!selectedPlan || !pricingInfo) return null;
  return (
    <>
      <Flex
        sx={{
          flexDirection: "column"
        }}
      >
        <Text variant="title" sx={{}}>
          Summary
        </Text>
        <Box sx={{ my: 2, height: 1, bg: "separator" }} />
        <CheckoutPricing pricingInfo={pricingInfo} />
        {couponCode && pricingInfo.discount.amount > 0 ? (
          <IconTag
            icon={Coupon}
            text={couponCode}
            styles={{ container: { alignSelf: "end", mt: 2 } }}
          />
        ) : null}
      </Flex>
    </>
  );
}

function CheckoutSummary() {
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);
  const couponCode = useCheckoutStore((store) => store.couponCode);

  console.log(pricingInfo);
  if (!selectedPlan || !pricingInfo) return null;
  return (
    <>
      <Flex
        sx={{
          flexDirection: "column"
        }}
      >
        <Text variant="title" sx={{}}>
          Summary
        </Text>
        <Box sx={{ my: 2, height: 1, bg: "separator" }} />
        <Text variant="subtitle" sx={{}}>
          Notesnook Pro
        </Text>
        <Box as="ul" sx={{ paddingInlineStart: 30, mt: 1 }}>
          {[
            "Unlimited real time sync",
            "Unlimited storage",
            "Exports in PDF, HTML & Markdown",
            "Unlimited devices",
            "Recurring reminders",
            "Unlimited notebooks & tags",
            "Automatic backups"
          ].map((feature) => (
            <Text
              as="li"
              key={feature}
              variant="body"
              sx={{ color: "paragraph-secondary", mt: 1 }}
            >
              {feature}
            </Text>
          ))}
        </Box>
        <Box sx={{ my: 2, height: 1, bg: "separator" }} />
        <CheckoutPricing pricingInfo={pricingInfo} />

        {couponCode && pricingInfo.discount.amount > 0 ? (
          <IconTag
            icon={Coupon}
            text={couponCode}
            styles={{ container: { alignSelf: "end", mt: 2 } }}
          />
        ) : null}
      </Flex>
      <Flex sx={{ flexDirection: "column", gap: 2, mt: 2 }}>
        <Flex
          sx={{
            p: 2,
            bg: "background-secondary",
            borderRadius: "default",
            border: "1px solid var(--border)",
            flexDirection: "column"
          }}
        >
          <Text variant="body" sx={{ fontWeight: "bold" }}>
            Privacy seems expensive until you get hacked!
          </Text>
          <Text variant="subBody">
            Hey there! We&apos;re a small team of developers focused on bringing
            you the best note-taking experience. Your support helps us keep the
            lights on.
          </Text>
        </Flex>
        <Flex
          sx={{
            p: 2,
            bg: "black",
            borderRadius: 10,
            border: "1px solid var(--border)",
            gap: 2
          }}
        >
          <Check size={16} color="white" />
          <Text
            variant="body"
            sx={{
              color: "white"
            }}
          >
            {pricingInfo.period === "yearly" ? "30" : "7"}-day money-back
            guarantee
          </Text>
        </Flex>
      </Flex>
    </>
  );
}
