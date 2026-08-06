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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb"
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests, try again later." });
  }

  const { staticSystemPrompt, dynamicSystemPrompt, userText, image, history } = req.body;

  if (!userText && !image) {
    return res.status(400).json({ error: "Missing userText or image" });
  }

  const content = [];
  if (image && image.base64 && image.mediaType) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType,
        data: image.base64
      }
    });
  }
  content.push({
    type: "text",
    text: userText || "Analyze this screenshot of a text conversation."
  });

  // Prior turns are plain text only — screenshots aren't resent on later
  // turns, so image cost never compounds across a conversation.
  const priorMessages = Array.isArray(history)
    ? history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  const messages = [...priorMessages, { role: "user", content }];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 180,
        system: [
          {
            type: "text",
            text: staticSystemPrompt || "",
            cache_control: { type: "ephemeral" }
          },
          {
            type: "text",
            text: dynamicSystemPrompt || ""
          }
        ],
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Anthropic API request failed",
        type: data.error?.type || "unknown_error"
      });
    }

    const textBlock = (data.content || []).find((b) => b.type === "text");

    return res.status(200).json({ reply: textBlock ? textBlock.text : null });
  } catch (err) {
    return res.status(500).json({ error: "Failed to reach Claude" });
  }
}
