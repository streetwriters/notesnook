import {
  AuthenticationResult,
  PublicClientApplication,
} from "@azure/msal-node";
import { AuthConfig, SCOPES } from "./config";
import {
  PersistenceCachePlugin,
  FilePersistence,
} from "@azure/msal-node-extensions";

let client: PublicClientApplication | undefined;

async function getClient(config: AuthConfig): Promise<PublicClientApplication> {
  if (!client) {
    const persistence = await FilePersistence.create("./tokenCache.json");

    client = new PublicClientApplication({
      auth: {
        authority: "https://login.microsoftonline.com/common",
        clientId: config.clientId,
      },
      cache: {
        cachePlugin: new PersistenceCachePlugin(persistence),
      },
    });
  }
  return client;
}

export async function authenticate(
  config: AuthConfig
): Promise<AuthenticationResult | null> {
  const client = await getClient(config);
  const accountInfo = await client.getTokenCache().getAllAccounts();

  return await client
    .acquireTokenSilent({
      scopes: SCOPES,
      account: accountInfo[0],
    })
    .catch(() => {
      if (!client) return null;
      return client.acquireTokenByDeviceCode({
        scopes: SCOPES,
        deviceCodeCallback: (res) => {
          console.log(res.message);
        },
      });
    });
}
