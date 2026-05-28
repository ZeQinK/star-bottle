/**
 * api/notes.js — Star Bottle notes API using Vercel Edge Config
 *
 * Required env vars (set in Vercel Dashboard → Project → Settings → Environment Variables):
 *   EDGE_CONFIG          → auto-set by Vercel when you link an Edge Config store
 *                          format: https://edge-config.vercel.com/ecfg_xxxx?token=xxxx
 *   VERCEL_TOKEN         → your Vercel personal access token (needed for WRITES)
 *                          Create one at: https://vercel.com/account/tokens
 *
 * GET  /api/notes?bottle=NAME  → returns { notes: [...] }
 * POST /api/notes?bottle=NAME  → body { notes: [...] } → saves and returns { success: true }
 */
export default async function handler(req, res) {
  // ── CORS headers ──────────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── Parse bottle ID ───────────────────────────────────────────────────────
  const urlObj = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const bottle = urlObj.searchParams.get('bottle');
  if (!bottle) return res.status(400).json({ error: 'Missing bottle parameter' });

  // Sanitise key: only letters, numbers, hyphens, underscores
  const safeKey = 'starbottle_' + bottle.replace(/[^a-zA-Z0-9-_]/g, '');

  // ── Parse EDGE_CONFIG connection string ───────────────────────────────────
  // Format: https://edge-config.vercel.com/ecfg_XXXX?token=YYYY
  const edgeConfigConnectionString = process.env.EDGE_CONFIG;
  const vercelToken = process.env.VERCEL_TOKEN;

  if (!edgeConfigConnectionString) {
    return res.status(500).json({
      error: 'EDGE_CONFIG env var is missing. Connect your Edge Config store in Vercel Dashboard.',
      code: 'EDGE_CONFIG_NOT_CONFIGURED'
    });
  }

  // Extract Edge Config ID and read token from the connection string
  let ecId, readToken;
  try {
    const ecUrl = new URL(edgeConfigConnectionString);
    // pathname is like /ecfg_XXXX
    ecId = ecUrl.pathname.replace(/^\//, '');
    readToken = ecUrl.searchParams.get('token');
  } catch {
    return res.status(500).json({ error: 'EDGE_CONFIG value is malformed.' });
  }

  if (!ecId || !readToken) {
    return res.status(500).json({ error: 'Could not parse Edge Config ID or token.' });
  }

  // ── GET: Read notes ───────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const response = await fetch(
        `https://edge-config.vercel.com/${ecId}/item/${safeKey}?token=${readToken}`
      );

      // 404 means the key doesn't exist yet — return empty array
      if (response.status === 404) {
        return res.status(200).json({ notes: [] });
      }

      if (!response.ok) {
        throw new Error(`Edge Config read error: ${response.status} ${response.statusText}`);
      }

      const value = await response.json();
      // value is the raw stored value (already an array)
      const notes = Array.isArray(value) ? value : [];
      return res.status(200).json({ notes });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: Write notes ─────────────────────────────────────────────────────
  if (req.method === 'POST') {
    if (!vercelToken) {
      return res.status(500).json({
        error: 'VERCEL_TOKEN env var is missing. Add your Vercel personal access token to enable writes.',
        code: 'VERCEL_TOKEN_MISSING'
      });
    }

    // Parse request body
    let notes = [];
    try {
      if (req.body && typeof req.body === 'object' && Array.isArray(req.body.notes)) {
        notes = req.body.notes;
      } else {
        let bodyStr = typeof req.body === 'string' ? req.body : '';
        if (!bodyStr) {
          bodyStr = await new Promise((resolve) => {
            let chunks = '';
            req.on('data', chunk => { chunks += chunk; });
            req.on('end', () => resolve(chunks));
          });
        }
        if (bodyStr) {
          const parsed = JSON.parse(bodyStr);
          if (Array.isArray(parsed.notes)) notes = parsed.notes;
        }
      }
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    // Write to Edge Config via Vercel REST Management API
    try {
      const writeResponse = await fetch(
        `https://api.vercel.com/v1/edge-config/${ecId}/items`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: [
              { operation: 'upsert', key: safeKey, value: notes }
            ]
          })
        }
      );

      if (!writeResponse.ok) {
        const errorBody = await writeResponse.text();
        throw new Error(`Edge Config write error: ${writeResponse.status} — ${errorBody}`);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
