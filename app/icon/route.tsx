import { ImageResponse } from "next/og";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            fontSize: 32,
            fontWeight: 700,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <svg
            width="75"
            viewBox="0 0 75 65"
            fill="#000"
            style={{ margin: '0 75px' }}
          >
            <path d="m37.59.25v48.78h7.65v-48.78h-7.65z"/>
            <path d="m28.94 0c-3.64 0-6.31 2.67-6.31 6.31v32.37c0 3.64 2.67 6.31 6.31 6.31h32.37c3.64 0 6.31-2.67 6.31-6.31v-32.37c0-3.64-2.67-6.31-6.31-6.31h-32.37zm2.67 2.67h27.03v27.03h-27.03v-27.03z"/>
            <path d="m0 37.59c0 3.64 2.67 6.31 6.31 6.31h32.37c3.64 0 6.31-2.67 6.31-6.31v-32.37c0-3.64-2.67-6.31-6.31-6.31h-32.37c-3.64 0-6.31 2.67-6.31 6.31v32.37zm2.67-32.37h27.03v27.03h-27.03v-27.03z"/>
          </svg>
          <div style={{ marginTop: 40 }}>Fashion Landing</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.error(e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
