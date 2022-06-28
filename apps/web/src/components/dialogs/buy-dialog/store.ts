import { Plan, PricingInfo } from "./types";
import create from "zustand";
import produce from "immer";

interface ICheckoutStore {
  selectedPlan?: Plan;
  onPlanSelected: (plan?: Plan) => void;
  pricingInfo?: PricingInfo;
  onPriceUpdated: (pricingInfo?: PricingInfo) => void;
  isApplyingCoupon: boolean;
  setIsApplyingCoupon: (isApplyingCoupon: boolean) => void;
  couponCode?: string;
  onApplyCoupon: (couponCode?: string) => void;
  reset: () => void;
}
export const useCheckoutStore = create<ICheckoutStore>((set, get) => ({
  selectedPlan: undefined,
  pricingInfo: undefined,
  couponCode: undefined,
  isApplyingCoupon: false,
  onPlanSelected: (plan) =>
    set(
      produce((state: ICheckoutStore) => {
        state.selectedPlan = plan;
        state.pricingInfo = undefined;
      })
    ),
  onPriceUpdated: (pricingInfo) =>
    set(
      produce((state: ICheckoutStore) => {
        state.pricingInfo = pricingInfo;
      })
    ),
  onApplyCoupon: (couponCode) =>
    set(
      produce((state: ICheckoutStore) => {
        console.log("SETTING coupon", couponCode);
        state.couponCode = couponCode;
      })
    ),
  setIsApplyingCoupon: (isApplyingCoupon) =>
    set(
      produce((state: ICheckoutStore) => {
        state.isApplyingCoupon = isApplyingCoupon;
      })
    ),
  reset: () => {
    set(
      produce((state: ICheckoutStore) => {
        state.selectedPlan = undefined;
        state.pricingInfo = undefined;
        state.couponCode = undefined;
        state.isApplyingCoupon = false;
      })
    );
  },
}));
