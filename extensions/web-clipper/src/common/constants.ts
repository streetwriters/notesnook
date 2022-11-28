export const APP_URL =
  process.env.NODE_ENV === "production"
    ? "https://app.notesnook.com"
    : "http://localhost:3000";
export const APP_URL_FILTER =
  process.env.NODE_ENV === "production"
    ? ["*://app.notesnook.com/*"]
    : ["*://localhost/*"];
