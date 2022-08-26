import { SUBSCRIPTION_STATUS } from "../common/constants";
import {
  useStore as useUserStore,
  store as userstore
} from "../stores/user-store";

export function useIsUserPremium() {
  const user = useUserStore((store) => store.user);
  return isUserPremium(user);
}

export function isUserPremium(user) {
  if (process.env.REACT_APP_CI) return true;
  if (!user) user = userstore.get().user;

  const subStatus = user?.subscription?.type;
  return (
    subStatus === SUBSCRIPTION_STATUS.BETA ||
    subStatus === SUBSCRIPTION_STATUS.PREMIUM ||
    subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELED ||
    subStatus === SUBSCRIPTION_STATUS.TRIAL
  );
}
