/**
 * @typedef {{
 *  groupBy: "abc" | "year" | "month" | "week" | undefined,
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
 *  }
 * }} User
 */
