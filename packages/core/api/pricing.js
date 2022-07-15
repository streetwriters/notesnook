import http from "../utils/http";

const BASE_URL = `https://notesnook.com/api/v1/prices`;
class Pricing {
  /**
   *
   * @param {"android"|"ios"|"web"} platform
   * @param {"monthly"|"yearly"} period
   * @returns {Promise<{
   *    country: string,
   *    countryCode: string,
   *    sku: string,
   *    discount: number
   * }>}
   */
  sku(platform, period) {
    return http.get(`${BASE_URL}/skus/${platform}/${period}`);
  }

  /**
   *
   * @param {"monthly"|"yearly"} period
   * @returns {Promise<{
   *    country: string,
   *    countryCode: string,
   *    price: string,
   *    discount: number
   * }>}
   */
  price(period) {
    return http.get(`${BASE_URL}/${period}`);
  }
}
export default Pricing;
