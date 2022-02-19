import { config } from "dotenv";
config();

export const AuthConfig = {
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
  scopes: ["User.Read", "Notes.Read.All", "Notes.Read"],
};
