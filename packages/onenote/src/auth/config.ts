export type AuthConfig = {
  clientId: string;
  redirectUri?: string;
};

export const SCOPES = ["User.Read", "Notes.Read.All", "Notes.Read"];
