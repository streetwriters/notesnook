import { Text, Flex, Button } from "rebass";
import * as Icon from "../../icons";
import { ReactComponent as Nomad } from "../../../assets/nomad.svg";
import { Period, Plan } from "./types";
import { PLAN_METADATA, usePlans } from "./plans";
import { useEffect } from "react";
import { getCurrencySymbol } from "./helpers";

type PlansListProps = {
  onPlanSelected: (plan: Plan) => void;
  onPlansLoaded?: (plans: Plan[]) => void;
};
export function PlansList(props: PlansListProps) {
  const { onPlanSelected, onPlansLoaded } = props;
  const { isLoading, plans, discount, country } = usePlans();

  useEffect(() => {
    if (isLoading || !onPlansLoaded) return;
    onPlansLoaded(plans);
  }, [isLoading, onPlansLoaded, plans]);

  return (
    <>
      <Nomad width={200} />
      <Text variant="heading" textAlign="center" mt={4}>
        Choose a plan
      </Text>
      <Text variant="body" textAlign="center" mt={1}>
        {discount ? (
          <>
            We are giving a special <b>{discount}% discount</b> to all users
            from {country}.
          </>
        ) : (
          "Notesnook profits when you purchase a subscription — not by selling your data."
        )}
      </Text>
      <Flex flexDirection="column" alignSelf="stretch" mt={2}>
        {plans.map((plan) => {
          const metadata = PLAN_METADATA[plan.period];
          return (
            <Button
              disabled={isLoading}
              data-test-id={`checkout-plan-${plan.period}`}
              variant="tool"
              display="flex"
              textAlign="start"
              justifyContent="space-between"
              alignItems="center"
              flex={1}
              mt={1}
              bg="transparent"
              // sx={
              //   {
              //     // bg: selectedPlan?.key === plan.key ? "border" : "transparent",
              //     // border:
              //     //   selectedPlan?.key === plan.key ? "1px solid var(--primary)" : "none",
              //   }
              // }
              onClick={() => onPlanSelected(plan)}
            >
              <Text variant="subtitle" fontWeight="normal">
                {metadata.title}
                <Text variant="body" fontWeight="normal" color="fontTertiary">
                  {metadata.subtitle}
                </Text>
              </Text>
              {isLoading ? <Icon.Loading /> : <RecurringPricing plan={plan} />}
            </Button>
          );
        })}
      </Flex>
    </>
  );
}

type RecurringPricingProps = {
  plan: Plan;
};
function RecurringPricing(props: RecurringPricingProps) {
  const { plan } = props;
  return (
    <Text
      sx={{ flexShrink: 0 }}
      variant="body"
      fontSize="subBody"
      textAlign={"end"}
    >
      {plan.originalPrice && (
        <Text
          color="fontTertiary"
          fontSize={"body"}
          sx={{ textDecorationLine: "line-through" }}
        >
          {getCurrencySymbol(plan.currency)}
          {plan.originalPrice.gross}
        </Text>
      )}
      <Text>
        <Text as="span" fontSize="subtitle">
          {getCurrencySymbol(plan.currency)}
          {plan.price.gross}
        </Text>
        {formatPeriod(plan.period)}
      </Text>
    </Text>
  );
}

export function formatPeriod(period: Period) {
  return period === "monthly" ? "/mo" : period === "yearly" ? "/yr" : "";
}
