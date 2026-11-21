import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue';
import d1NextTagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';
import { softTagFilter, withFilter } from '@opennextjs/cloudflare/overrides/tag-cache/tag-cache-filter';

/* ------------------------------------------------------------------ *
 *  OpenNext → Cloudflare Workers. No Durable Objects.
 *  - ISR / SSG pages are stored in Workers KV (NEXT_INC_CACHE_KV).
 *  - Time-based revalidation uses the in-worker queue (a stale page is
 *    regenerated through the worker's own service binding).
 *  - revalidateTag() (admin edits to posts, menus, gallery, videos …) is
 *    recorded in a small D1 table. Next's internal path tags (`_N_T_/…`,
 *    only needed for revalidatePath, which this app never calls) are
 *    filtered out, so a cached page costs one indexed D1 read.
 *
 *  The first setup used the sharded Durable Object tag cache: every page
 *  view made dozens of Durable Object requests and a three-user admin
 *  reached the 100,000/day free limit. Do not bring it back for a site
 *  this size.
 * ------------------------------------------------------------------ */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
  tagCache: withFilter({ tagCache: d1NextTagCache, filterFn: softTagFilter }),
});
