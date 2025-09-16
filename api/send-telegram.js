// api/send-telegram.js
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ALLOWED_ORIGINS (comma-separated)

module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const allowAll = allowed.length === 1 && allowed[0] === '*';
  const isAllowed = allowAll || allowed.includes(origin);
  const corsOrigin = allowAll ? '*' : (isAllowed ? origin : '');

  // Preflight
  if (req.method === 'OPTIONS') {
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.status(503).json({ ok: false, error: 'telegram_not_configured' });
    return;
  }

  let data = req.body;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch {}
  }
  if (!data || typeof data !== 'object') {
    // Fallback: try raw body
    try {
      const chunks = [];
      await new Promise((resolve) => {
        req.on('data', c => chunks.push(c));
        req.on('end', resolve);
      });
      const raw = Buffer.concat(chunks).toString('utf8');
      data = raw ? JSON.parse(raw) : null;
    } catch {}
  }

  const name = (data && data.name ? String(data.name) : '').trim();
  const email = (data && data.email ? String(data.email) : '').trim();
  const message = (data && data.message ? String(data.message) : '').trim();

  const emailRe = /^(?:[^\s@]+)@(?:[^\s@]+)\.(?:[^\s@]+)$/;
  if (name.length < 2 || !emailRe.test(email) || message.length < 4) {
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.status(400).json({ ok: false, error: 'invalid_payload' });
    return;
  }

  const text = [
    'New portfolio message:',
    `Name: ${name}`,
    `Email: ${email}`,
    'Message:',
    message,
  ].join('\n');

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    const json = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || json.ok === false) {
      const desc = json && json.description ? json.description : `status_${tgRes.status}`;
      if (corsOrigin) {
        res.setHeader('Access-Control-Allow-Origin', corsOrigin);
        res.setHeader('Vary', 'Origin');
      }
      res.status(502).json({ ok: false, error: `telegram_error: ${desc}` });
      return;
    }
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Vary', 'Origin');
    }
    res.status(500).json({ ok: false, error: 'request_failed' });
  }
};
