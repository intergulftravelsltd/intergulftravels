import { unstable_cache } from 'next/cache';
import { youtubeId, type Video } from '@/lib/youtube';

export type { Video } from '@/lib/youtube';
export { youtubeId, youtubeEmbed, youtubeThumb } from '@/lib/youtube';

/** Published videos (cookieless + cached — was a live per-request query). */
const load = async (): Promise<Video[]> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const db = createAdminClient();
    const { data } = await db
      .from('videos')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    return ((data ?? []) as any[]).map((v) => ({
      ...v,
      youtube_id: v.youtube_id || youtubeId(v.youtube_url),
    })) as Video[];
  } catch {
    return [];
  }
};

export const getVideos = unstable_cache(load, ['videos-v1'], {
  revalidate: 120,
  tags: ['videos'],
});
