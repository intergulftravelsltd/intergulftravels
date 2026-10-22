/* ------------------------------------------------------------------ *
 *  Row order for printed / exported passenger lists: every permanent
 *  family group prints as a block — the group leader first, then the
 *  members under them — and everyone who is not in a group follows at
 *  the end. Within a block, and among blocks and singles, the list's own
 *  sort order is kept. Plain module (no server imports).
 * ------------------------------------------------------------------ */

/**
 * @param rows         the filtered + sorted rows of the list
 * @param idOf         a row's own id
 * @param headIdOf     the row's group head id (null for a head or a single)
 * @param headsWithMembers ids of every head that has at least one member
 *                     (from the unfiltered set, so a head whose members are
 *                     filtered out still prints as a leader)
 */
export function orderByGroup<T>(
  rows: T[],
  idOf: (row: T) => string,
  headIdOf: (row: T) => string | null | undefined,
  headsWithMembers: ReadonlySet<string> | Map<string, unknown>,
): T[] {
  const isHead = (id: string) => headsWithMembers.has(id);
  const byId = new Map(rows.map((r) => [idOf(r), r]));
  const membersOf = new Map<string, T[]>();
  const singles: T[] = [];
  for (const r of rows) {
    const h = headIdOf(r);
    if (h) membersOf.set(h, [...(membersOf.get(h) ?? []), r]);
    else if (!isHead(idOf(r))) singles.push(r);
  }

  const out: T[] = [];
  const done = new Set<string>();
  for (const r of rows) {
    const id = idOf(r);
    const headId = headIdOf(r) ?? (isHead(id) ? id : null);
    if (!headId || done.has(headId)) continue;
    done.add(headId);
    const head = byId.get(headId);
    if (head) out.push(head);
    out.push(...(membersOf.get(headId) ?? []));
  }
  return [...out, ...singles];
}
