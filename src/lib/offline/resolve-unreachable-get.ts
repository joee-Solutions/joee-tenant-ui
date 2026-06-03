import { offlineService } from "./offlineService";

/** Build cache keys the same way list GETs are stored (path variants). */
export function buildOfflineCacheKeys(url: string): string[] {
  let basePath = url;
  let queryString = "";

  try {
    const urlObj = new URL(
      url.startsWith("http") ? url : `http://localhost${url.startsWith("/") ? url : `/${url}`}`
    );
    basePath = urlObj.pathname;
    queryString = urlObj.search;
  } catch {
    const queryIndex = url.indexOf("?");
    if (queryIndex !== -1) {
      basePath = url.substring(0, queryIndex);
      queryString = url.substring(queryIndex);
    }
  }

  return [
    ...new Set([
      url,
      url.startsWith("/") ? url : `/${url}`,
      basePath,
      basePath.startsWith("/") ? basePath : `/${basePath}`,
      queryString ? `${basePath}${queryString}` : basePath,
      url.replace(/^\/api/, ""),
      url.replace(/^\/api/, "").startsWith("/")
        ? url.replace(/^\/api/, "")
        : `/${url.replace(/^\/api/, "")}`,
    ]),
  ];
}

/**
 * When the API proxy is down but the browser is still "online", return the last
 * IndexedDB list snapshot (includes optimistic offline rows).
 */
export async function resolveUnreachableGet(url: string): Promise<unknown | null> {
  for (const cacheKey of buildOfflineCacheKeys(url)) {
    const cached = await offlineService.getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }
  }
  return null;
}
