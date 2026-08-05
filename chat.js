export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
