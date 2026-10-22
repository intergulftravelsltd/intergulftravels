import { ImageResponse } from 'next/og';
import { getPost } from '@/lib/blog';

export const alt = 'Inter Gulf Travels — Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function BlogOgImage({ params }: { params: { slug: string } }) {
  let title = 'Inter Gulf Travels — Journal';
  let category = 'Hajj & Umrah';
  try {
    const post = await getPost(params.slug);
    if (post) {
      title = post.title;
      category = post.categoryLabel;
    }
  } catch {
    // fall back to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px',
          background: 'linear-gradient(135deg, #06402b 0%, #0a6248 55%, #0e7c5a 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              background: '#e7c97a',
              color: '#06402b',
              padding: '10px 22px',
              borderRadius: 9999,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {category.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, lineHeight: 1.12, maxWidth: 1000 }}>
          {title.length > 110 ? `${title.slice(0, 107)}…` : title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#e7c97a' }}>
            Inter Gulf Travels Ltd
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,0.65)' }}>
            intergulftravelsltd.com/blog
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
