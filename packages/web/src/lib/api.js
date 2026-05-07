export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('vmd_token');
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('vmd_token');
    window.location.reload();
  }
  return res;
}
