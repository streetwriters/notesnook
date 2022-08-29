import { CLIENT_ID } from "../common";
import hosts from "../utils/constants";
import http from "../utils/http";

export default class Offers {
  async getCode(promo, platform) {
    const result = await http.get(
      `${hosts.SUBSCRIPTIONS_HOST}/offers?promoCode=${promo}&clientId=${CLIENT_ID}&platformId=${platform}`
    );
    return result.code;
  }
}
