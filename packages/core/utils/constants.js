import { extractHostname } from "./hostname";

function isProduction() {
  return (
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test"
  );
}

const hosts = {
  API_HOST: isProduction()
    ? "https://api.notesnook.com"
    : "http://localhost:5264",
  AUTH_HOST: isProduction()
    ? "https://auth.streetwriters.co"
    : "http://localhost:8264",
  SSE_HOST: isProduction()
    ? "https://events.streetwriters.co"
    : "http://localhost:7264",
  SUBSCRIPTIONS_HOST: isProduction()
    ? "https://subscriptions.streetwriters.co"
    : "http://localhost:9264",
  ISSUES_HOST: isProduction()
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
  return names[host];
};
