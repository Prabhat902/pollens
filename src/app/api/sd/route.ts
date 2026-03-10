/* 
 * Stable Diffusion API Route - COMMENTED OUT
 * Uncomment when needed
 */

/*
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    }

    // Proxy to Stable Diffusion API
    const response = await fetch("https://stablediffusionapi.com/api/v3/text2img", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("SD Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
*/

// Placeholder export to prevent build errors
export async function POST() {
  return new Response("Route disabled", { status: 503 });
}
