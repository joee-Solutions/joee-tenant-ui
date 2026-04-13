/**
 * Offline queued writes already update SWR + IndexedDB optimistically.
 * Calling bound `mutate()` / `globalMutate(..., { revalidate: true })` afterwards
 * refetches and can overwrite the optimistic list with stale cache or fail the fetch.
 */
export function isOfflineQueuedResponse(res: unknown): boolean {
  return Boolean(
    res &&
      typeof res === "object" &&
      "_offline" in res &&
      (res as { _offline?: boolean })._offline === true
  );
}

export function revalidateListAfterMutation(
  res: unknown,
  revalidate: () => void | Promise<unknown>
): void {
  if (isOfflineQueuedResponse(res)) return;
  void revalidate();
}
