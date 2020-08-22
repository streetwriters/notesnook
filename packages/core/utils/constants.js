export const HOST =
  process.env.NODE_ENV === "production"
    ? "https://api.notesnook.com/"
    : "http://0.0.0.0:8000/";
export const HEADERS = {
  agent: "nn/1.0.0",
  origin: "notesnook.com",
  "Content-Type": "application/json",
  Accept: "application/json",
};
