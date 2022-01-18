import { extractHostname } from "./hostname";

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
  ISSUES_HOST:
    process.env.NODE_ENV === "production"
      ? "https://issues.streetwriters.co"
      : "http://localhost:2624",
};

export default hosts;

export const getServerNameFromHost = (host) => {
  const names = {
    [extractHostname(hosts.API_HOST)]: "Notesnook Sync Server",
    [extractHostname(hosts.AUTH_HOST)]: "Authentication Server",
    [extractHostname(hosts.SSE_HOST)]: "Eventing Server",
    [extractHostname(hosts.SUBSCRIPTIONS_HOST)]:
      "Subscriptions Management Server",
    [extractHostname(hosts.ISSUES_HOST)]: "Bug Reporting Server",
  };
  console.log(names, host);
  return names[host];
};
