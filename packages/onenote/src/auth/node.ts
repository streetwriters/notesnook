import {
  AuthenticationResult,
  PublicClientApplication,
} from "@azure/msal-node";
import { AuthConfig } from "./config";
import {
  PersistenceCachePlugin,
  FilePersistence,
} from "@azure/msal-node-extensions";

let client: PublicClientApplication | undefined;

async function init(): Promise<PublicClientApplication> {
  const persistence = await FilePersistence.create("./tokenCache.json");

  return new PublicClientApplication({
    auth: {
      authority: "https://login.microsoftonline.com/common",
      clientId: AuthConfig.clientId,
      clientSecret: AuthConfig.clientSecret,
    },
    cache: {
      cachePlugin: new PersistenceCachePlugin(persistence),
    },
  });
}

export async function authenticate(): Promise<AuthenticationResult | null> {
  if (!client) client = await init();
  const accountInfo = await client.getTokenCache().getAllAccounts();

  return await client
    .acquireTokenSilent({
      scopes: AuthConfig.scopes,
      account: accountInfo[0],
    })
    .catch(() => {
      console.error("Cache miss.");
      if (!client) return null;
      return client.acquireTokenByDeviceCode({
        scopes: AuthConfig.scopes,
        deviceCodeCallback: (res) => {
          console.log(res.message);
        },
      });
    });
}
