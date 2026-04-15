import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load .env.local (or .env) so GITHUB_TOKEN is available server-side only
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

const app = express();
const PORT = 3001;

// ─── 1. Security Headers ───
// Helmet sets dozens of HTTP headers that harden against XSS, clickjacking,
// MIME-sniffing, and other common web attacks.
app.use(helmet());

// ─── 2. Rate Limiting ───
// Prevent Denial-of-Wallet and brute-force abuse.
// 10 requests per 15 minutes per IP is generous for real dental use
// but blocks automated scraping.
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
});

// Global rate limit — catches reconnaissance on health checks, etc.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

// ─── 3. Strict CORS ───
// In production on Vercel, set the ALLOWED_ORIGINS env var to your exact domain
// e.g.  https://dental-shade.vercel.app
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server / same-origin requests (origin is undefined)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'OPTIONS'],          // Only methods actually needed
  allowedHeaders: ['Content-Type'],       // No Authorization from client needed
  credentials: false,                     // No cookies needed
}));

// ─── 4. Body parser with strict size limit ───
// 10 MB is enough for two dental photos; 20 MB was too generous
// and could allow memory-exhaustion payloads.
app.use(express.json({ limit: '10mb' }));

// ─── 5. Health check (safe — never leaks token value) ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ─── 6. Input validation helpers ───
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BASE64_LENGTH = 10 * 1024 * 1024; // ~7.5 MB decoded image

const isValidImageData = (img: unknown): img is { base64: string; mimeType: string } => {
  if (!img || typeof img !== 'object') return false;
  const obj = img as Record<string, unknown>;
  return (
    typeof obj.base64 === 'string' &&
    typeof obj.mimeType === 'string' &&
    obj.base64.length > 100 &&                        // minimum viable image
    obj.base64.length <= MAX_BASE64_LENGTH &&          // prevent memory bombs
    ALLOWED_MIME_TYPES.includes(obj.mimeType) &&       // whitelist mime types
    /^[A-Za-z0-9+/=\r\n]+$/.test(obj.base64)          // valid base64 characters only
  );
};

// ─── 7. Analyze endpoint ───
app.post('/api/analyze', analyzeLimiter, async (req, res) => {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error('GITHUB_TOKEN missing from environment variables.');
    // Generic error — never tell the attacker *what* is misconfigured
    return res.status(500).json({ error: 'Service temporarily unavailable.' });
  }

  try {
    const { naturalImage, newImage } = req.body;

    // Strict input validation
    if (!isValidImageData(naturalImage) || !isValidImageData(newImage)) {
      return res.status(400).json({
        error: 'Invalid payload: Both images must be valid JPEG, PNG, WebP, or GIF under 10 MB.',
      });
    }

    // Server-side locked prompt — client CANNOT inject or modify this
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
    const timeout = setTimeout(() => controller.abort(), 60_000); // 60 second timeout

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
      // Sanitized error — never leak upstream details to the client
      return res.status(502).json({
        error: 'AI service temporarily unavailable. Please try again later.',
      });
    }

    const data = await response.json();

    // Validate the upstream response structure before forwarding
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      console.error('Unexpected API response structure:', JSON.stringify(data).substring(0, 200));
      return res.status(502).json({ error: 'Received an unexpected response from the AI service.' });
    }

    // Only forward the parsed result, not the raw upstream envelope
    res.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('Request to GitHub Models API timed out.');
      return res.status(504).json({ error: 'AI service timed out. Please try again.' });
    }
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Catch-all: reject everything else ───
app.all('*', (_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Only start the listener for local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Secure API proxy running on http://localhost:${PORT}`);
    console.log(`   Token configured: ${!!process.env.GITHUB_TOKEN}`);
  });
}

// Export the app for Vercel serverless function use
export default app;
