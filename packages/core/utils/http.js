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

import { EV, EVENTS } from "../common";
import { logger } from "../logger";
import { getServerNameFromHost } from "./constants";
import { extractHostname } from "./hostname";

function get(url, token) {
  return request(url, token, "GET");
}

function deleteRequest(url, token) {
  return request(url, token, "DELETE");
}

function patch(url, data, token) {
  return bodyRequest(url, data, token, "PATCH");
}

patch.json = function (url, data, token) {
  return bodyRequest(url, data, token, "PATCH", "application/json");
};

function post(url, data, token) {
  return bodyRequest(url, data, token, "POST");
}

post.json = function (url, data, token) {
  return bodyRequest(url, data, token, "POST", "application/json");
};

export default {
  get,
  post,
  delete: deleteRequest,
  patch
};

function transformer(data, type) {
  if (!data) return;
  if (type === "application/json") return JSON.stringify(data);
  else {
    return Object.entries(data)
      .map(([key, value]) =>
        value ? `${encodeURIComponent(key)}=${encodeURIComponent(value)}` : ""
      )
      .join("&");
  }
}

/**
 *
 * @param {Response} response
 * @returns
 */
async function handleResponse(response) {
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
    logger.error(e, "Error while sending request:", { url: response.url });
    throw e;
  }
}

async function request(url, token, method) {
  return handleResponse(
    await fetchWrapped(url, {
      method,
      headers: getAuthorizationHeader(token)
    })
  );
}

async function bodyRequest(
  url,
  data,
  token,
  method,
  contentType = "application/x-www-form-urlencoded"
) {
  return handleResponse(
    await fetchWrapped(url, {
      method,
      body: transformer(data, contentType),
      headers: {
        ...getAuthorizationHeader(token),
        "Content-Type": contentType
      }
    })
  );
}

function getAuthorizationHeader(token) {
  return token ? { Authorization: "Bearer " + token } : {};
}

export function errorTransformer(errorJson) {
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
      errorMessage = error_description || error || "An unknown error occurred.";
      errorCode = error;
      break;
  }

  return {
    description: errorMessage,
    code: errorCode,
    data: data ? JSON.parse(data) : undefined
  };
}

/**
 *
 * @param {RequestInfo} input
 * @param {RequestInit} init
 */
async function fetchWrapped(input, init) {
  try {
    const response = await fetch(input, init);
    return response;
  } catch (e) {
    const host = extractHostname(input);
    const serverName = getServerNameFromHost(host);
    if (serverName)
      throw new Error(
        `${serverName} is not responding. Please check your internet connection. If the problem persists, feel free email us at support@streetwriters.co. (Reference error: ${e.message})`
      );

    throw e;
  }
}

export class RequestError extends Error {
  constructor(error) {
    super(error.description);
    this.code = error.code;
    this.data = error.data;
  }
}
