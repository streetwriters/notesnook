import {
  PublicClientApplication,
  AuthenticationResult,
} from "@azure/msal-browser";
import { AuthConfig } from "./config";

const client = new PublicClientApplication({
  auth: {
    clientId: AuthConfig.clientId,
    authority: "https://login.windows-ppe.net/common/",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
});

export async function authenticate(): Promise<AuthenticationResult | null> {
  return await client
    .acquireTokenSilent({
      scopes: AuthConfig.scopes,
    })
    .catch(() => {
      console.error("Cache miss.");
      if (!client) return null;
      return client.acquireTokenPopup({
        scopes: AuthConfig.scopes,
      });
    });
}
