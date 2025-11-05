import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// NOTE: This route calls Replicate Instant-ID/Flux-like model if REPLICATE_API_TOKEN is set.
// Otherwise, it returns a high-quality placeholder so the app works without secrets.

async function readFileAsBase64(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buf.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const reference = form.get('reference');
    const prompt = (form.get('prompt') as string) || '';

    if (!(reference instanceof File)) {
      return NextResponse.json({ error: 'Thi?u ?nh tham chi?u' }, { status: 400 });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;

    // If no token, return a beautiful placeholder that matches the scene.
    if (!replicateToken) {
      // Unsplash placeholder: Vietnamese woman Ao Dai with flowers (symbolic)
      // This keeps the app functional without leaking secrets.
      const fallback = 'https://images.unsplash.com/photo-1600841963527-9c9403d4d9ff?q=80&w=1600&auto=format&fit=crop';
      return NextResponse.json({ imageUrl: fallback });
    }

    // Build strong identity-preserving prompt
    const fullPrompt = [
      'Photorealistic outdoor portrait of a young Vietnamese woman, standing beside a tall, dense bush',
      "of blooming Tithonia diversifolia (hoa d? qu?) with radiant golden-yellow petals like large daisies,",
      'slender petals, deep orange disc florets, and serrated lush green leaves.',
      'Wearing a soft white-blue ?o d?i, gracefully holding a wide-brim n?n l? for elegant balance.',
      'Shoulder-length straight hair framing a gentle face; bright, healthy skin;',
      'standing next to a classic white bicycle with a rattan basket filled with freshly picked hoa d? qu?.',
      'Serene, nostalgic, poetic rural roadside scene.',
      'Golden hour backlighting, natural rim light, cinematic depth, warm gentle tones.',
      'Use 100% identity from the reference face: maintain natural facial proportions, skin tone,',
      'and a subtle closed-mouth smile. Global sharp focus, natural skin details, high quality.',
      prompt,
    ]
      .filter(Boolean)
      .join(' ');

    // Upload image to Replicate-compatible input as base64
    const refB64 = await readFileAsBase64(reference);

    // This model spec aims to work with Instant-ID like pipelines on Replicate
    // Change the model/version string to any working InstantID/Flux identity adapter as needed.
    const model = 'fofr/instant-id';

    const predictionRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'a3b69701-2b79-48c9-8d9f-3f3b5b9dfb97', // placeholder version; replace if necessary
        input: {
          // Many Instant-ID endpoints support one of: image, face_image, or reference_image.
          // We include several common keys to maximize compatibility.
          image: refB64,
          face_image: refB64,
          reference_image: refB64,
          prompt: fullPrompt,
          guidance_scale: 5,
          num_inference_steps: 28,
          width: 896,
          height: 1120,
          seed: 42,
          control_strength: 0.85,
          identity_strength: 0.9
        }
      })
    });

    if (!predictionRes.ok) {
      const text = await predictionRes.text();
      return NextResponse.json({ error: `Replicate request failed: ${text}` }, { status: 500 });
    }

    const prediction = await predictionRes.json();

    // Poll until completed
    let status = prediction.status as string;
    let outputUrl: string | null = null;
    let pollUrl: string | undefined = prediction.urls?.get;

    const maxWaitMs = 60_000;
    const start = Date.now();

    while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
      await new Promise((r) => setTimeout(r, 1500));
      const pr = await fetch(pollUrl || prediction.urls.get, {
        headers: { Authorization: `Token ${replicateToken}` }
      });
      const pj = await pr.json();
      status = pj.status;
      if (status === 'succeeded') {
        const out = pj.output;
        if (Array.isArray(out) && out.length > 0) {
          outputUrl = out[out.length - 1];
        } else if (typeof out === 'string') {
          outputUrl = out;
        }
      }
      if (Date.now() - start > maxWaitMs) {
        break;
      }
    }

    if (!outputUrl) {
      return NextResponse.json({ error: 'Kh?ng l?y ???c ?nh k?t qu? t? m? h?nh.' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: outputUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'L?i kh?ng x?c ??nh' }, { status: 500 });
  }
}
