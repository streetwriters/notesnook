const hosts = {
  API_HOST:
    process.env.NODE_ENV === "production"
      ? "https://api.notesnook.com"
      : "http://localhost:5264",
  AUTH_HOST:
    process.env.NODE_ENV === "production"
      ? "https://auth.streetwriters.co"
      : "http://localhost:8264",
  SSE_HOST:
    process.env.NODE_ENV === "production"
      ? "https://events.streetwriters.co"
      : "http://localhost:7264",
  SUBSCRIPTIONS_HOST:
    process.env.NODE_ENV === "production"
      ? "https://subscriptions.streetwriters.co"
      : "http://localhost:9264",
};

export default hosts;
