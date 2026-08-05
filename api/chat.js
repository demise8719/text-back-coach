// Best-effort in-memory rate limit. Resets whenever the serverless function
// cold-starts, so this is a backstop against casual abuse, not a hard
// guarantee. The real spending protection is the monthly cap set in the
// Anthropic console.
const REQUESTS_PER_WINDOW = 30;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const record = hits.get(ip);
  if (!record || now - record.windowStart > WINDOW_MS) {
    hits.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  record.count += 1;
  return record.count > REQUESTS_PER_WINDOW;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests, try again later." });
  }

  const { systemPrompt, userText } = req.body;

  if (!userText) {
    return res.status(400).json({ error: "Missing userText" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userText }]
      })
    });

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");

    return res.status(200).json({ reply: textBlock ? textBlock.text : null });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach Claude" });
  }
}
