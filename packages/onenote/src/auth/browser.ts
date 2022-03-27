import {
  PublicClientApplication,
  AuthenticationResult,
} from "@azure/msal-browser";
import { AuthConfig, SCOPES } from "./config";

let client: PublicClientApplication | undefined;

function getClient(config: AuthConfig): PublicClientApplication {
  if (!client)
    client = new PublicClientApplication({
      auth: {
        clientId: config.clientId,
        redirectUri: config.redirectUri,
      },
      cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
        secureCookies: false,
      },
    });
  return client;
}

export async function authenticate(
  config: AuthConfig
): Promise<AuthenticationResult | null> {
  const client = getClient(config);
  const accounts = client.getAllAccounts();
  return await client
    .acquireTokenSilent({
      scopes: SCOPES,
      account: accounts[0],
    })
    .catch(() => {
      if (!client) return null;
      return client.acquireTokenPopup({
        scopes: SCOPES,
      });
    });
}
