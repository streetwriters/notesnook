/**
 * @typedef {{
 *  groupBy: "abc" | "year" | "month" | "week" | "none" | undefined,
 *  sortBy: "dateCreated" | "dateDeleted" | "dateEdited" | "title",
 *  sortDirection: "desc" | "asc"
 * }} GroupOptions
 */

/**
 * @typedef {"home" | "notes" | "notebooks" | "tags" | "topics" | "trash" | "favorites"} GroupingKey
 */

/**
 * @typedef {{
 *  id: string,
 *  email: string,
 *  isEmailConfirmed: boolean,
 *  mfa: {
 *      isEnabled: boolean,
 *      primaryMethod: string,
 *      secondaryMethod: string,
 *      remainingValidCodes: number
 *  },
 *  subscription: {
 *      appId: 0,
 *      cancelURL: string | null,
 *      expiry: number,
 *      productId: string,
 *      provider: 0 | 1 | 2 | 3,
 *      start: number,
 *      type: 0 | 1 | 2 | 5 | 6 | 7,
 *      updateURL: string | null,
 *  }
 * }} User
 */
