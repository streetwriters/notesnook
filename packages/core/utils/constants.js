const module = {
  API_HOST:
    process.env.NODE_ENV === "production"
      ? "https://api.notesnook.com"
      : "http://localhost:5264",
  AUTH_HOST:
    process.env.NODE_ENV === "production"
      ? "https://auth.streetwriters.co"
      : "http://localhost:8264",
};

export default module;
