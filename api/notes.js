export default async function handler(req, res) {
  // Set CORS headers so it works everywhere
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req;
  const urlObj = new URL(url, `http://${req.headers.host || 'localhost'}`);
  const bottle = urlObj.searchParams.get('bottle');

  if (!bottle) {
    return res.status(400).json({ error: 'Missing bottle parameter' });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ 
      error: 'Vercel KV is not configured. Please connect KV in Vercel Dashboard.',
      code: 'KV_NOT_CONFIGURED'
    });
  }

  // Sanitize key name to prevent issues
  const safeBottleId = bottle.replace(/[^a-zA-Z0-9-_]/g, '');
  const key = `starbottle:${safeBottleId}`;

  // GET: Fetch notes for a bottle
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${kvUrl}/get/${key}`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`Upstash Redis error: ${response.statusText}`);
      }

      const data = await response.json();
      
      let notes = [];
      if (data.result) {
        notes = JSON.parse(data.result);
      }
      return res.status(200).json({ notes });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST: Save notes for a bottle
  if (req.method === 'POST') {
    try {
      let notes = [];
      if (req.body && typeof req.body === 'object' && Array.isArray(req.body.notes)) {
        notes = req.body.notes;
      } else {
        // Fallback for body parsing if needed
        let bodyStr = '';
        if (typeof req.body === 'string') {
          bodyStr = req.body;
        } else {
          bodyStr = await new Promise((resolve) => {
            let chunkData = '';
            req.on('data', chunk => { chunkData += chunk; });
            req.on('end', () => resolve(chunkData));
          });
        }
        
        if (bodyStr) {
          const parsed = JSON.parse(bodyStr);
          if (Array.isArray(parsed.notes)) {
            notes = parsed.notes;
          }
        }
      }

      const response = await fetch(`${kvUrl}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(notes)) // Redis SET accepts stringified value
      });

      if (!response.ok) {
        throw new Error(`Upstash Redis error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.result === 'OK') {
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ error: 'Failed to write to KV' });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
