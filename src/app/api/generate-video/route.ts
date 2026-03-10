import { NextRequest, NextResponse } from 'next/server';

// This route returns the signed Pollinations URL as JSON instead of proxying the video.
// This is necessary because grok-video takes 40-90 seconds to render, which exceeds
// Vercel's 10-second Hobby tier serverless function timeout.
// The frontend then fetches directly from Pollinations (which supports CORS).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt');
    const model = searchParams.get('model') || 'grok-video';
    const seed = searchParams.get('seed') || Math.floor(Math.random() * 999999).toString();
    const aspectRatio = searchParams.get('aspect_ratio') || '16:9';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get API key from environment variable (keeps it hidden until this authenticated request)
    const apiKey = process.env.POLLINATIONS_API_KEY || '';
    if (!apiKey) {
      console.warn('POLLINATIONS_API_KEY is not set. Video generation requires an API key.');
    }
    const keyParam = apiKey ? `&key=${apiKey}` : '';

    // Build Pollinations URL
    const pollinationsUrl = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?model=${model}&aspect_ratio=${encodeURIComponent(aspectRatio)}&seed=${seed}${keyParam}`;
    
    console.log(`🎬 Returning signed video URL for ${model}...`);
    
    // Return the URL as JSON — the frontend will fetch directly from Pollinations
    // This completes in <100ms, completely avoiding Vercel's 10s timeout
    return NextResponse.json({ url: pollinationsUrl });
    
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
