function get(url, token) {
  return request(url, token, "GET");
}

function deleteRequest(url, token) {
  return request(url, token, "DELETE");
}

function patch(url, data, token) {
  return bodyRequest(url, data, false, token, "PATCH");
}

function post(url, data, token) {
  return bodyRequest(url, data, false, token, "POST");
}

post.json = function (url, data, token) {
  return bodyRequest(url, data, true, token, "POST");
};

function transformer(data, json) {
  if (json) return JSON.stringify(data);
  else {
    return Object.entries(data)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
  }
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const json = await response.json();
    if (response.ok) {
      return json;
    }

    let error = json.error || json.errors.join("\n");
    throw new Error(error);
  } else {
    if (response.ok) return await response.text();
    else
      throw new Error(
        `Request failed with status code: ${response.status} ${response.statusText}.`
      );
  }
}

async function request(url, token, method) {
  return handleResponse(
    await fetch(url, {
      method,
      headers: { Authorization: token ? "Bearer " + token : undefined },
    })
  );
}

async function bodyRequest(url, data, json = true, token, method) {
  return handleResponse(
    await fetch(url, {
      method,
      body: transformer(data, json),
      headers: {
        Authorization: token ? "Bearer " + token : undefined,
        "Content-Type": json
          ? "application/json"
          : "application/x-www-form-urlencoded",
      },
    })
  );
}

export default {
  get,
  post,
  delete: deleteRequest,
  patch,
};
