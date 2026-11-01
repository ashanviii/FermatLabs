import { ImageResponse } from 'next/og';

export const alt = 'Fermat — one group trip everyone can actually take';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'stretch',
          background: '#fafaf8',
          color: '#13251d',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
          height: '100%',
          justifyContent: 'space-between',
          padding: '64px 72px',
          width: '100%',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
          <div
            style={{
              alignItems: 'center',
              background: '#0f5132',
              borderRadius: 22,
              color: 'white',
              display: 'flex',
              fontSize: 42,
              height: 72,
              justifyContent: 'center',
              width: 72,
            }}
          >
            F
          </div>
          <div style={{ fontSize: 42, fontWeight: 700 }}>Fermat</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ color: '#287753', fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
            GROUP TRIPS, SORTED
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -3, lineHeight: 1.04, maxWidth: 980 }}>
            One trip everyone can actually take.
          </div>
          <div style={{ color: '#46584f', fontSize: 30 }}>
            Private budgets · fair voting · a plan the whole group can afford
          </div>
        </div>
      </div>
    ),
    size,
  );
}
