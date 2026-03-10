/* 
 * Google Imagen API Route - COMMENTED OUT
 * Uncomment when needed
 */

/*
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, token, aspectRatio, model } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${token}`;

    const googleBody = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio || "1:1",
      },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();

    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      return NextResponse.json({ error: "No image returned from Google" }, { status: 500 });
    }

    const imageBuffer = Buffer.from(base64Image, "base64");

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("Google Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
*/

// Placeholder export to prevent build errors
export async function POST() {
  return new Response("Route disabled", { status: 503 });
}
