import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quote = searchParams.get('quote') || '한 문장을 선물드려요.';
    const author = searchParams.get('author') || '익명';
    const source = searchParams.get('source') || '';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#f0f0f0',
            padding: '50px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          <p style={{ fontSize: '48px', fontWeight: 'bold', margin: '0 0 20px 0' }}>
            “{quote}”
          </p>
          <p style={{ fontSize: '32px', margin: '0' }}>
            — {author}
            {source && <span style={{ marginLeft: '10px' }}>· {source}</span>}
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, { status: 500 });
  }
}