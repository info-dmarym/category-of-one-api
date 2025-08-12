// Minimal POST /api/generate endpoint with CORS + JSON output
import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, mode = "suggest" } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    // You must set OPENAI_API_KEY in Vercel > Project > Settings > Environment Variables
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Lower temp = safer/saner (suggest). Higher temp = spicier (shuffle)
    const temperature = mode === "shuffle" ? 0.9 : 0.3;

    // Ask the model to return strict JSON with the expected keys
    const system = `You write marketing assets for small service firms. 
Return ONLY valid JSON with keys: uvp, case_study, linkedin_post, blog_article, email_outreach. No commentary.`;

    const user = prompt;

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    const text = resp.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
