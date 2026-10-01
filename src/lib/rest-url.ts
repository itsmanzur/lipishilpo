/** Preserve WordPress's rest_route query on sites using plain permalinks. */
export function buildRestUrl(base: string, path: string, origin: string): string {
  const url = new URL(base, origin);
  const queryIndex = path.indexOf('?');
  const endpoint = (queryIndex < 0 ? path : path.slice(0, queryIndex)).replace(/^\//, '');
  const route = url.searchParams.get('rest_route');
  if (route !== null) {
    url.searchParams.set('rest_route', route.replace(/\/$/, '') + '/' + endpoint);
  } else {
    url.pathname = url.pathname.replace(/\/$/, '') + '/' + endpoint;
  }
  if (queryIndex >= 0) {
    new URLSearchParams(path.slice(queryIndex + 1)).forEach((value, key) => url.searchParams.set(key, value));
  }
  return url.toString();
}
