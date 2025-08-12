// Minimal POST /api/generate for Vercel (Node.js serverless)
// No package.json, no vercel.json needed. CORS included.

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = await readBody(req);
    const { prompt, mode = "suggest" } = body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const temperature = mode === "shuffle" ? 0.9 : 0.3;

    const system = `You write marketing assets for small service firms.
Return ONLY valid JSON with keys: uvp, case_study, linkedin_post, blog_article, email_outreach. No commentary.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return res.status(500).json({ error: "OpenAI error", detail: txt });
    }

    const data = await resp.json();
    const text = (data.choices?.[0]?.message?.content ?? "").trim();
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

// Helper to read JSON body on Vercel Node serverless
function readBody(req) {
  return new Promise((resolve, reject) => {
    try {
      let data = "";
      req.on("data", chunk => (data += chunk));
      req.on("end", () => {
        try { resolve(data ? JSON.parse(data) : {}); }
        catch (e) { resolve({}); }
      });
    } catch (e) { reject(e); }
  });
}
