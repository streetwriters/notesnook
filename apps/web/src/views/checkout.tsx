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
import { hardNavigate, hashNavigate, useQueryParams } from "../navigation";
import { Support } from "../components/icons";
import { HeadlessAuth } from "./auth";
import {
  CheckoutCompleted,
  CheckoutDetails,
  CheckoutPricing
} from "../dialogs/buy-dialog";
import { useCheckoutStore } from "../dialogs/buy-dialog/store";
import { useStore as useUserStore } from "../stores/user-store";
import { z } from "zod";
import {
  FEATURE_HIGHLIGHTS,
  toPricingInfo
} from "../dialogs/buy-dialog/helpers";
import { isUserSubscribed } from "../hooks/use-is-user-premium";
import { PLAN_METADATA } from "../dialogs/buy-dialog/plans";
import { planToAvailability } from "@notesnook/common";
import { FeatureCaption } from "../dialogs/buy-dialog/feature-caption";
import { EV, EVENTS } from "@notesnook/core";

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

const CHECKOUT_STEPS = ["Account", "Payment", "Complete"];
function Checkout() {
  const [{ plan }] = useQueryParams();

  const [currentStep, setCurrentStep] = useState(0);
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
      setCurrentStep(1);
    }
  }, [plan]);

  useEffect(() => {
    if (currentStep === 2) {
      const event = EV.subscribe(EVENTS.userSubscriptionUpdated, () => {
        hardNavigate("/notes#/welcome");
      });
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
          px: 2
        }}
      >
        <a href="/" style={{ textDecoration: "none" }}>
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
        </a>
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
                    setCustomer(user);
                    setCurrentStep(isUserSubscribed(user) ? 2 : 1);
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
                      setCurrentStep(2);
                    }
                  }}
                />
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
      </Flex>
    </>
  );
}

function CheckoutSummary() {
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);

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
          {PLAN_METADATA[selectedPlan.plan].title} plan
        </Text>
        <Flex
          sx={{
            flexDirection: "column",
            mt: 2,
            gap: 1
          }}
        >
          {FEATURE_HIGHLIGHTS.map((feature) => {
            const caption =
              feature.availability[planToAvailability(selectedPlan.plan)]
                .caption;
            return (
              <Flex key={feature.id} sx={{ justifyContent: "space-between" }}>
                <Text variant="body">{feature.title}</Text>
                <Text variant="body" sx={{ color: "paragraph-secondary" }}>
                  <FeatureCaption caption={caption} />
                </Text>
              </Flex>
            );
          })}
        </Flex>
        <Box sx={{ my: 2, height: 1, bg: "separator" }} />
        <CheckoutPricing pricingInfo={pricingInfo} />
      </Flex>
    </>
  );
}
