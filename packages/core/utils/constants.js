const module = {
  HOST:
    process.env.NODE_ENV === "production"
      ? "https://api.notesnook.com"
      : "http://0.0.0.0:8000",
  HEADERS: {
    agent: "nn/1.0.0",
    origin: "notesnook.com",
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

export default module;
