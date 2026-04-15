import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Input validation ───
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BASE64_LENGTH = 10 * 1024 * 1024; // ~7.5 MB decoded

const isValidImageData = (img: unknown): img is { base64: string; mimeType: string } => {
  if (!img || typeof img !== 'object') return false;
  const obj = img as Record<string, unknown>;
  return (
    typeof obj.base64 === 'string' &&
    typeof obj.mimeType === 'string' &&
    obj.base64.length > 100 &&
    obj.base64.length <= MAX_BASE64_LENGTH &&
    ALLOWED_MIME_TYPES.includes(obj.mimeType) &&
    /^[A-Za-z0-9+/=\r\n]+$/.test(obj.base64)
  );
};

// ─── Security headers ───
function setSecurityHeaders(res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

// ─── CORS ───
function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);

  if (setCorsHeaders(req, res)) return; // preflight handled

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN missing from environment variables.');
    return res.status(500).json({ error: 'Service temporarily unavailable.' });
  }

  try {
    const { naturalImage, newImage } = req.body;

    if (!isValidImageData(naturalImage) || !isValidImageData(newImage)) {
      return res.status(400).json({
        error: 'Invalid payload: Both images must be valid JPEG, PNG, WebP, or GIF under 10 MB.',
      });
    }

    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert dental assistant AI helping a senior dentist with color matching. The dentist has slight vision loss and relies on your precise analysis.

You will receive two images:
- Image 1: The patient's natural tooth (baseline).
- Image 2: The new restoration.

Analyze both images and respond with a JSON object containing exactly these fields:
- "naturalShade": Estimated VITA classical shade (e.g., A1, B2) for the natural tooth.
- "newShade": Estimated VITA classical shade for the new tooth/restoration.
- "matchScore": A number from 0 to 100, where 100 is a perfect match.
- "analysis": Detailed comparison of color, translucency, and value (lightness) between the two.
- "verdict": Short verdict (e.g., "Excellent Match", "Needs Adjustment").
- "recommendation": Actionable advice for the dentist if adjustments are needed, or confirmation if it's a good match.

IMPORTANT: Respond ONLY with the JSON object. Do not include any other text.`,
      },
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: 'Image 1 (Natural Tooth / Baseline):' },
          {
            type: 'image_url' as const,
            image_url: {
              url: `data:${naturalImage.mimeType};base64,${naturalImage.base64}`,
            },
          },
          { type: 'text' as const, text: 'Image 2 (New Tooth / Restoration):' },
          {
            type: 'image_url' as const,
            image_url: {
              url: `data:${newImage.mimeType};base64,${newImage.base64}`,
            },
          },
          {
            type: 'text' as const,
            text: 'Please analyze both images and provide your assessment as the JSON object described in your instructions.',
          },
        ],
      },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`GitHub Models API error (${response.status}):`, errorBody);
      return res.status(502).json({
        error: 'AI service temporarily unavailable. Please try again later.',
      });
    }

    const data = await response.json();

    // Extract content — handle various response shapes
    const choice = data?.choices?.[0];
    const content = choice?.message?.content;

    // Check if the model refused or content was filtered
    if (choice?.finish_reason === 'content_filter') {
      return res.status(422).json({ error: 'The AI could not process these images. Please try with clearer dental photos.' });
    }

    if (typeof content === 'string' && content.length > 0) {
      return res.json(data);
    }

    // Content might be null/undefined — log full structure for debugging
    console.error('Unexpected API response:', JSON.stringify(data).substring(0, 500));
    return res.status(502).json({
      error: 'The AI returned an empty response. Please try again with clearer photos.',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('Request to GitHub Models API timed out.');
      return res.status(504).json({ error: 'AI service timed out. Please try again.' });
    }
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
