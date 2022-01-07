import { EV, EVENTS } from "../common";

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
  patch,
};

function transformer(data, type) {
  if (!data) return;
  if (type === "application/json") return JSON.stringify(data);
  else {
    return Object.entries(data)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
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
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const json = await response.json();
    if (response.ok) {
      return json;
    }
    throw new Error(errorTransformer(json));
  } else {
    if (response.status === 429) throw new Error("You are being rate limited.");

    if (response.ok) return await response.text();
    else if (response.status === 401) {
      EV.publish(EVENTS.userUnauthorized, response.url);
      throw new Error("Unauthorized.");
    } else
      throw new Error(
        `Request failed with status code: ${response.status} ${response.statusText}.`
      );
  }
}

async function request(url, token, method) {
  return handleResponse(
    await fetch(url, {
      method,
      headers: getAuthorizationHeader(token),
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
    await fetch(url, {
      method,
      body: transformer(data, contentType),
      headers: {
        ...getAuthorizationHeader(token),
        "Content-Type": contentType,
      },
    })
  );
}

function getAuthorizationHeader(token) {
  return token ? { Authorization: "Bearer " + token } : {};
}

function errorTransformer(errorJson) {
  if (!errorJson.error && !errorJson.errors && !errorJson.error_description)
    return "Unknown error.";
  const { error, error_description, errors } = errorJson;

  if (errors) {
    return errors.join("\n");
  }

  switch (error) {
    case "invalid_grant": {
      switch (error_description) {
        case "invalid_username_or_password":
          return "Username or password incorrect.";
        default:
          return error_description || error;
      }
    }
    default:
      return error_description || error;
  }
}

// /**
//  *
//  * @param {RequestInfo} resource
//  * @param {RequestInit} options
//  * @returns
//  */
// async function fetchWithTimeout(resource, options = {}) {
//   try {
//     const { timeout = 8000 } = options;

//     const controller = new AbortController();
//     const id = setTimeout(() => controller.abort(), timeout);
//     const response = await fetch(resource, {
//       ...options,
//       signal: controller.signal,
//     });
//     clearTimeout(id);
//     return response;
//   } catch (e) {
//     if (e.name === "AbortError") throw new Error("Request timed out.");
//     throw e;
//   }
// }
