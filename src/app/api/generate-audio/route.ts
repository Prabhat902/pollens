import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const voice = searchParams.get('voice') || 'sarah';
    const model = searchParams.get('model') || 'elevenlabs';
    const format = searchParams.get('response_format') || 'mp3';
    const speed = searchParams.get('speed') || '1.0';

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Get API key from environment variable (keeps it hidden from frontend)
    const apiKey = process.env.POLLINATIONS_API_KEY || '';
    const keyParam = apiKey ? `&key=${apiKey}` : '';

    // Build Pollinations URL (hidden from frontend)
    const pollinationsUrl = `https://gen.pollinations.ai/audio/${encodeURIComponent(text)}?model=${model}&voice=${voice}&response_format=${format}&speed=${speed}${keyParam}`;
    
    // Fetch audio from Pollinations
    const response = await fetch(pollinationsUrl, {
      headers: {
        'User-Agent': 'ImageGenerator/1.0',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations API Error response:', errorText);
      throw new Error(`Pollinations API error: ${response.status}`);
    }
    
    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Return audio with appropriate headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': `audio/${format === 'mp3' ? 'mpeg' : format}`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
    
  } catch (error: any) {
    console.error('Audio generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate audio' },
      { status: 500 }
    );
  }
}
