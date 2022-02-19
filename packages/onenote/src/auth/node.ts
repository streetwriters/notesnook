import {
  AuthenticationResult,
  PublicClientApplication,
} from "@azure/msal-node";
import { AuthConfig } from "./config";
import {
  DataProtectionScope,
  Environment,
  PersistenceCreator,
  PersistenceCachePlugin,
} from "@azure/msal-node-extensions";
import path from "path";

let client: PublicClientApplication | undefined;

async function init(): Promise<PublicClientApplication> {
  const persistenceConfiguration = {
    cachePath: "./tokenCache.json",
    dataProtectionScope: DataProtectionScope.CurrentUser,
    usePlaintextFileOnLinux: true,
    serviceName: "Notesnook Importer",
    accountName: "Notesnook Importer",
  };

  const persistence = await PersistenceCreator.createPersistence(
    persistenceConfiguration
  );

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

  return await client.acquireTokenByDeviceCode({
    scopes: AuthConfig.scopes,
    deviceCodeCallback: (res) => {
      console.log(res.message);
    },
  });
}
