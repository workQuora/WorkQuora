/** Normalize backend `{ success, data, token, user }` payloads for hooks/pages. */
export function getApiData(response) {
  const body = response?.data ?? response;
  if (body?.data !== undefined) return body.data;
  return body;
}

export function getAuthPayload(response) {
  const body = response?.data ?? response;
  return {
    user: body.user ?? body.data,
    token: body.token,
  };
}
