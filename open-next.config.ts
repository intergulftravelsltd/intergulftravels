import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache';

/* ------------------------------------------------------------------ *
 *  OpenNext → Cloudflare Workers.
 *  - ISR / SSG pages are stored in Workers KV (NEXT_INC_CACHE_KV) — no billing
 *    needed; move to R2 (r2IncrementalCache) once R2 is enabled on the account.
 *  - Time-based revalidation goes through a Durable Object queue.
 *  - revalidateTag() (admin edits to posts, menus, gallery, videos …) is
 *    tracked in a sharded Durable Object tag cache, so an edit shows on the
 *    public site right away instead of after the 5-minute window.
 * ------------------------------------------------------------------ */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: doQueue,
  // Small site: 2 shards and a 5-second regional cache keep Durable Object
  // requests per page view low (an admin edit shows within ~5 s).
  tagCache: doShardedTagCache({ baseShardSize: 2, regionalCache: true, regionalCacheTtlSec: 5 }),
});
