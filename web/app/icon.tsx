import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Matches components/Logo.tsx's navbar badge — same gradient, same "W".
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e00a9 0%, #6366f1 50%, #22d3ee 100%)',
          borderRadius: 7,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: -1,
            color: '#ffffff',
            fontFamily: 'sans-serif',
          }}
        >
          W
        </div>
      </div>
    ),
    { ...size }
  );
}
