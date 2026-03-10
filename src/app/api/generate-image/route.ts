import { NextRequest, NextResponse } from 'next/server';

// Backend proxy to Pollinations API - hides the actual API from frontend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt');
    const width = searchParams.get('width') || '1280';
    const height = searchParams.get('height') || '720';
    const seed = searchParams.get('seed') || Math.floor(Math.random() * 999999).toString();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get API key from environment variable (keeps it hidden from frontend)
    const apiKey = process.env.POLLINATIONS_API_KEY || '';
    const keyParam = apiKey ? `&key=${apiKey}` : '';

    // Build Pollinations URL (hidden from frontend)
    const pollinationsUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=flux&width=${width}&height=${height}&seed=${seed}&nologo=true${keyParam}`;
    
    // Fetch image from Pollinations
    const response = await fetch(pollinationsUrl, {
      headers: {
        'User-Agent': 'ImageGenerator/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.status}`);
    }
    
    // Get image as buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Return image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
    
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
