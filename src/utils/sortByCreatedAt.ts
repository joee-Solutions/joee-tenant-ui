/** Resolve a create-date timestamp from common API field names. */
export function getCreatedAtTime(item: unknown): number {
  if (!item || typeof item !== "object") return 0;
  const row = item as Record<string, unknown>;
  const raw =
    row.created_at ??
    row.createdAt ??
    row.created ??
    row.date_created ??
    row.dateCreated ??
    row.date ??
    null;
  if (raw == null || raw === "") return 0;
  const t = new Date(raw as string | number | Date).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Sort rows by create date ascending (oldest first). Stable for missing dates. */
export function sortByCreatedAtAsc<T>(items: readonly T[] | null | undefined): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (items.length === 1) return [...items];
  return [...items].sort((a, b) => {
    const aTime = getCreatedAtTime(a);
    const bTime = getCreatedAtTime(b);
    if (aTime !== bTime) return aTime - bTime;
    // Stable fallback by id when dates match or are missing
    const aId = Number((a as { id?: number })?.id ?? 0);
    const bId = Number((b as { id?: number })?.id ?? 0);
    return aId - bId;
  });
}
