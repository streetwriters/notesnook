/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { EV, EVENTS } from "../common.js";
import { logger } from "../logger.js";
import { getServerNameFromHost } from "./constants.js";
import { extractHostname } from "./hostname.js";

type ContentType = "application/json" | "application/x-www-form-urlencoded";
type RequestBody = Record<string, string | number | boolean | undefined> | null;
type JsonRequestBody = Record<string, unknown> | null;
function get(url: string, token?: string) {
  return request(url, "GET", token);
}

function deleteRequest(url: string, token?: string) {
  return request(url, "DELETE", token);
}

function patch(url: string, data: RequestBody, token?: string) {
  return bodyRequest(url, transformFormData(data), token, "PATCH");
}

patch.json = function (url: string, data: JsonRequestBody, token?: string) {
  return bodyRequest(
    url,
    transformJson(data),
    token,
    "PATCH",
    "application/json"
  );
};

function post(url: string, data: RequestBody, token?: string) {
  return bodyRequest(url, transformFormData(data), token, "POST");
}

post.json = function (url: string, data: JsonRequestBody, token?: string) {
  return bodyRequest(
    url,
    transformJson(data),
    token,
    "POST",
    "application/json"
  );
};

export default {
  get,
  post,
  delete: deleteRequest,
  patch
};

async function request(url: string, method: "GET" | "DELETE", token?: string) {
  return handleResponse(
    await fetchWrapped(url, {
      method,
      headers: getHeaders(token)
    })
  );
}

async function bodyRequest(
  url: string,
  data: string | undefined,
  token: string | undefined,
  method: "POST" | "PATCH" | "PUT",
  contentType: ContentType = "application/x-www-form-urlencoded"
) {
  return handleResponse(
    await fetchWrapped(url, {
      method,
      body: data,
      headers: {
        ...getHeaders(token),
        "Content-Type": contentType
      }
    })
  );
}

export function errorTransformer(errorJson: {
  error?: string;
  errors?: string[];
  error_description?: string;
  data?: string;
}) {
  let errorMessage = "Unknown error.";
  let errorCode = "unknown";

  if (!errorJson.error && !errorJson.errors && !errorJson.error_description)
    return { description: errorMessage, code: errorCode, data: {} };
  const { error, error_description, errors, data } = errorJson;

  if (errors) {
    errorMessage = errors.join("\n");
  }

  outer: switch (error) {
    case "invalid_grant": {
      switch (error_description) {
        case "invalid_username_or_password":
          errorMessage = "Username or password incorrect.";
          errorCode = error_description;
          break outer;
        default:
          errorMessage = error_description || error;
          errorCode = error || "invalid_grant";
          break outer;
      }
    }
    default:
      errorMessage = error_description || error || errorMessage;
      errorCode = error || errorCode;
      break;
  }

  return {
    description: errorMessage,
    code: errorCode,
    data: data ? JSON.parse(data) : undefined
  };
}

async function fetchWrapped(input: string, init: RequestInit) {
  try {
    const response = await fetch(input, init);
    return response;
  } catch (e) {
    const host = extractHostname(input);
    const serverName = getServerNameFromHost(host);
    if (serverName)
      throw new Error(
        `${serverName} is not responding. Please check your internet connection. If the problem persists, feel free email us at support@streetwriters.co. (Reference error: ${
          (e as Error).message
        })`
      );

    throw e;
  }
}

async function handleResponse(response: Response) {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const json = await response.json();
      if (response.ok) {
        return json;
      }
      throw new RequestError(errorTransformer(json));
    } else {
      if (response.status === 429)
        throw new Error("You are being rate limited.");

      if (response.ok) return await response.text();
      else if (response.status === 401) {
        EV.publish(EVENTS.userUnauthorized, response.url);
        throw new Error("Unauthorized.");
      } else
        throw new Error(
          `Request failed with status code: ${response.status} ${response.statusText}.`
        );
    }
  } catch (e) {
    logger.error(e, "Error while sending request:", {
      url: response.url
    });
    throw e;
  }
}

export class RequestError extends Error {
  code: string;
  data: unknown;
  constructor(error: { code: string; data: unknown; description: string }) {
    super(error.description);
    this.code = error.code;
    this.data = error.data;
  }
}

function getHeaders(token?: string | null) {
  return token ? { Authorization: "Bearer " + token } : undefined;
}

function transformJson(data: JsonRequestBody) {
  return JSON.stringify(data);
}

function transformFormData(data: RequestBody) {
  if (data) {
    return Object.entries(data)
      .map(([key, value]) =>
        value
          ? `${encodeURIComponent(key)}=${
              value ? encodeURIComponent(value) : ""
            }`
          : ""
      )
      .join("&");
  }
}
